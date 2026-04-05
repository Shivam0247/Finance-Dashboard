import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('supabase.co') || process.env.DATABASE_URL?.includes('pooler.supabase.com')
    ? { rejectUnauthorized: false }
    : false,
});

export default pool;
