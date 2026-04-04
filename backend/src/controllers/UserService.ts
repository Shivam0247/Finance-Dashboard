import pool from '../database/pool';
import { PublicUser, Role } from '../utils/types';
import { AppError } from '../utils/AppError';

export class UserService {
    static async findAll(): Promise<PublicUser[]> {
        const result = await pool.query<PublicUser>(
            'SELECT id, name, email, role, status, created_at, updated_at FROM users ORDER BY name ASC'
        );
        return result.rows;
    }

    static async updateRole(id: string, role: Role): Promise<PublicUser> {
        const result = await pool.query<PublicUser>(
            'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, status, created_at, updated_at',
            [role, id]
        );

        if (result.rowCount === 0) {
            throw new AppError('User not found', 404);
        }

        return result.rows[0]!;
    }

    static async updateStatus(id: string, status: 'active' | 'inactive'): Promise<PublicUser> {
        const result = await pool.query<PublicUser>(
            'UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id, name, email, role, status, created_at, updated_at',
            [status, id]
        );

        if (result.rowCount === 0) {
            throw new AppError('User not found', 404);
        }

        return result.rows[0]!;
    }
}
