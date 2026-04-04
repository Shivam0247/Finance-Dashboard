import pool from '../database/pool';
import { PublicUser, Role } from '../utils/types';
import { AppError } from '../utils/AppError';
import { AuthService } from './AuthService';

export class UserService {
    static async findAll(search?: string): Promise<PublicUser[]> {
        let query = 'SELECT id, name, email, role, status, created_at, updated_at FROM users';
        const params: any[] = [];

        if (search) {
            query += ' WHERE name ILIKE $1 OR email ILIKE $1';
            params.push(`%${search}%`);
        }

        query += ' ORDER BY name ASC';
        const result = await pool.query<PublicUser>(query, params);
        return result.rows;
    }

    static async create(userData: { name: string; email: string; password: string; role: Role }): Promise<PublicUser> {
        const { name, email, password, role } = userData;

        // Check if user already exists
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rowCount && existingUser.rowCount > 0) {
            throw new AppError('User already exists with this email', 400);
        }

        const hashedPassword = await AuthService.hashPassword(password);

        const result = await pool.query<PublicUser>(
            'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, status, created_at, updated_at',
            [name, email, hashedPassword, role]
        );

        return result.rows[0]!;
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

    static async update(id: string, data: { name?: string; email?: string; role?: Role; status?: 'active' | 'inactive' }): Promise<PublicUser> {
        const fields: string[] = [];
        const params: any[] = [id];
        let paramIndex = 2;

        if (data.name) {
            fields.push(`name = $${paramIndex++}`);
            params.push(data.name);
        }
        if (data.email) {
            // Check if email is already taken by another user
            const existing = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [data.email, id]);
            if (existing.rowCount && existing.rowCount > 0) {
                throw new AppError('Email already taken', 400);
            }
            fields.push(`email = $${paramIndex++}`);
            params.push(data.email);
        }
        if (data.role) {
            fields.push(`role = $${paramIndex++}`);
            params.push(data.role);
        }
        if (data.status) {
            fields.push(`status = $${paramIndex++}`);
            params.push(data.status);
        }

        if (fields.length === 0) {
            throw new AppError('No fields to update', 400);
        }

        fields.push(`updated_at = NOW()`);

        const query = `
            UPDATE users 
            SET ${fields.join(', ')} 
            WHERE id = $1 
            RETURNING id, name, email, role, status, created_at, updated_at
        `;

        const result = await pool.query<PublicUser>(query, params);

        if (result.rowCount === 0) {
            throw new AppError('User not found', 404);
        }

        return result.rows[0]!;
    }

    static async delete(id: string): Promise<void> {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Delete user's transactions first (due to foreign key constraint)
            await client.query('DELETE FROM transactions WHERE user_id = $1', [id]);

            // 2. Delete the user
            const result = await client.query('DELETE FROM users WHERE id = $1', [id]);
            
            if (result.rowCount === 0) {
                throw new AppError('User not found', 404);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}
