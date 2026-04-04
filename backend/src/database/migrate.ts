import pool from './pool';

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Starting migration...');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT        NOT NULL,
        email       TEXT        UNIQUE NOT NULL,
        password    TEXT        NOT NULL,
        role        TEXT        NOT NULL CHECK (role IN ('admin', 'analyst', 'viewer')),
        status      TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Transactions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID        NOT NULL REFERENCES users(id),
        amount      NUMERIC     NOT NULL,
        type        TEXT        NOT NULL CHECK (type IN ('income', 'expense')),
        category    TEXT        NOT NULL,
        date        DATE        NOT NULL,
        notes       TEXT,
        deleted_at  TIMESTAMPTZ,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
