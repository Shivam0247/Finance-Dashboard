import pool from './pool';
import { AuthService } from '../controllers/AuthService';

const seed = async () => {
    const client = await pool.connect();
    try {
        console.log('Starting seeding...');

        // 1. Insert demo users
        const adminPassword = await AuthService.hashPassword('Admin@123');
        const analystPassword = await AuthService.hashPassword('Analyst@123');
        const viewerPassword = await AuthService.hashPassword('Viewer@123');

        const usersResult = await client.query(`
      INSERT INTO users (name, email, password, role, status)
      VALUES 
        ('Admin User', 'admin@finance.dev', $1, 'admin', 'active'),
        ('Analyst User', 'analyst@finance.dev', $2, 'analyst', 'active'),
        ('Viewer User', 'viewer@finance.dev', $3, 'viewer', 'active')
      ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = EXCLUDED.role, status = EXCLUDED.status
      RETURNING id, role
    `, [adminPassword, analystPassword, viewerPassword]);

        const users = usersResult.rows;
        const adminId = users.find(u => u.role === 'admin')?.id;
        const analystId = users.find(u => u.role === 'analyst')?.id;

        if (!adminId || !analystId) {
            throw new Error('Failed to create users');
        }

        // 2. Insert sample transactions
        const categories = ['Salary', 'Food', 'Rent', 'Utilities', 'Entertainment', 'Transport', 'Shopping', 'Healthcare'];
        const types = ['income', 'expense'] as const;

        const transactions: any[] = [];
        const now = new Date();

        for (let i = 0; i < 120; i++) {
            const type = i % 10 === 0 ? 'income' : 'expense';
            const category = type === 'income' ? 'Salary' : categories[Math.floor(Math.random() * (categories.length - 1)) + 1];
            const amount = type === 'income' ? 5000 + Math.random() * 2000 : 10 + Math.random() * 500;

            // Random date in last 6 months
            const date = new Date(now.getTime() - Math.random() * 180 * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];

            const userId = Math.random() > 0.5 ? adminId : analystId;

            transactions.push({
                user_id: userId,
                amount: parseFloat(amount.toFixed(2)),
                type,
                category,
                date: dateStr,
                notes: `Sample ${type} for ${category}`
            });
        }

        // Insert transactions
        for (const tx of transactions) {
            await client.query(`
        INSERT INTO transactions (user_id, amount, type, category, date, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [tx.user_id, tx.amount, tx.type, tx.category, tx.date, tx.notes]);
        }

        console.log('Seeding completed successfully.');
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
};

seed();
