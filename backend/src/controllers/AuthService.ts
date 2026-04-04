import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/pool';
import { PublicUser, User, JwtPayload } from '../utils/types';
import { AppError } from '../utils/AppError';

export class AuthService {
    private static readonly SALT_ROUNDS = 10;
    private static readonly SECRET = process.env.JWT_SECRET || 'fallback_secret';

    static async hashPassword(password: string): Promise<string> {
        return bcrypt.hash(password, this.SALT_ROUNDS);
    }

    static async login(email: string, password: string): Promise<{ token: string; user: PublicUser }> {
        const result = await pool.query<User>(
            'SELECT id, name, email, password, role, status FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

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

        const token = jwt.sign(payload, this.SECRET, { expiresIn: '1d' });

        const { password: _, ...publicUser } = user;

        return { token, user: publicUser };
    }

    static verifyToken(token: string): JwtPayload {
        try {
            return jwt.verify(token, this.SECRET) as JwtPayload;
        } catch (error) {
            throw new AppError('Invalid or expired token', 401);
        }
    }
}
