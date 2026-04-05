import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { PublicUser, JwtPayload } from '../utils/types';
import { AppError } from '../utils/AppError';

export class AuthService {
    private static readonly SALT_ROUNDS = 10;

    private static getSecret(): string {
        return process.env.JWT_SECRET || 'fallback_secret';
    }

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    static async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
        const user = await User.findOne({ email });

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        if (user.status === 'inactive') {
            throw new AppError('User account is inactive', 403);
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            throw new AppError('Invalid credentials', 401);
        }

        const payload: JwtPayload = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, this.getSecret(), { expiresIn: '1d' });

        const publicUser: PublicUser = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            status: user.status,
            created_at: user.created_at.toISOString(),
            updated_at: user.updated_at.toISOString()
        };

        return { token, user: publicUser };
    }

    static verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.getSecret()) as JwtPayload;
        } catch (error) {
            throw new AppError('Invalid or expired token', 401);
        }
    }
}
