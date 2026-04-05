import User from '../models/User';
import Transaction from '../models/Transaction';
import { PublicUser, Role } from '../utils/types';
import { AppError } from '../utils/AppError';
import { AuthService } from './AuthService';
import mongoose from 'mongoose';

export class UserService {
    private static toPublicUser(user: any): PublicUser {
        return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString()
        };
    }

    static async findAll(search?: string): Promise<PublicUser[]> {
        let query: any = {};

        if (search) {
            query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { email: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const users = await User.find(query).sort({ name: 1 });
        return users.map(user => this.toPublicUser(user));
    }

    static async create(userData: { name: string; email: string; password: string; role: Role }): Promise<PublicUser> {
        const { name, email, password, role } = userData;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            throw new AppError('User already exists with this email', 400);
        }

        const hashedPassword = await AuthService.hashPassword(password);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role
        });

        return this.toPublicUser(user);
    }

    static async updateRole(id: string, role: Role): Promise<PublicUser> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid user ID', 400);
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role, updated_at: new Date() },
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return this.toPublicUser(user);
    }

    static async updateStatus(id: string, status: 'active' | 'inactive'): Promise<PublicUser> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid user ID', 400);
        }

        const user = await User.findByIdAndUpdate(
            id,
            { status, updated_at: new Date() },
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return this.toPublicUser(user);
    }

    static async update(id: string, data: { name?: string; email?: string; role?: Role; status?: 'active' | 'inactive' }): Promise<PublicUser> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid user ID', 400);
        }

        if (data.email) {
            const existing = await User.findOne({ email: data.email });
            if (existing && existing._id.toString() !== id) {
                throw new AppError('Email already taken', 400);
            }
        }

        const user = await User.findByIdAndUpdate(
            id,
            { ...data, updated_at: new Date() },
            { new: true, runValidators: true }
        );

        if (!user) {
            throw new AppError('User not found', 404);
        }

        return this.toPublicUser(user);
    }

    static async delete(id: string): Promise<void> {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw new AppError('Invalid user ID', 400);
        }

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            await Transaction.deleteMany({ user_id: id }).session(session);
            const result = await User.findByIdAndDelete(id).session(session);

            if (!result) {
                throw new AppError('User not found', 404);
            }

            await session.commitTransaction();
        } catch (error) {
            await session.abortTransaction();
            throw error;
        } finally {
            session.endSession();
        }
    }
}
