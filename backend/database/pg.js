import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export function getPool() {
  return pool;
}

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (duration > 100) {
    console.log('Slow query:', { text, duration, rows: res.rowCount });
  }
  return res;
}

export async function getClient() {
  const client = await pool.connect();
  return client;
}

export async function initDatabase() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS branches (
        id SERIAL PRIMARY KEY,
        branch VARCHAR(50) UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS batches (
        id SERIAL PRIMARY KEY,
        batch INTEGER UNIQUE NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        is_staff BOOLEAN DEFAULT false,
        is_student BOOLEAN DEFAULT false,
        is_professor BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        usn VARCHAR(50) UNIQUE NOT NULL,
        batch_id INTEGER REFERENCES batches(id),
        branch_id INTEGER REFERENCES branches(id),
        email VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS professors (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        empid VARCHAR(50) UNIQUE NOT NULL,
        department_id INTEGER REFERENCES branches(id),
        email VARCHAR(255),
        first_name VARCHAR(100),
        last_name VARCHAR(100)
      );

      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sem INTEGER NOT NULL,
        branch_id INTEGER NOT NULL REFERENCES branches(id),
        batch_id INTEGER NOT NULL REFERENCES batches(id),
        file_path TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS marks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        sem INTEGER NOT NULL,
        batch_id INTEGER NOT NULL REFERENCES batches(id),
        branch_id INTEGER NOT NULL REFERENCES branches(id),
        subject_code VARCHAR(50) NOT NULL,
        subject_name VARCHAR(255) DEFAULT '',
        internal VARCHAR(20),
        external VARCHAR(20),
        total VARCHAR(20),
        result VARCHAR(10),
        announced_date VARCHAR(50) DEFAULT '',
        attempts INTEGER DEFAULT 1,
        original_sem INTEGER,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, subject_code, sem)
      );

      CREATE TABLE IF NOT EXISTS upload_jobs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        file_path TEXT NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        result_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_marks_user_id ON marks(user_id);
      CREATE INDEX IF NOT EXISTS idx_marks_branch_batch_sem ON marks(branch_id, batch_id, sem);
      CREATE INDEX IF NOT EXISTS idx_marks_subject_code ON marks(subject_code);
      CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
      CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
      CREATE INDEX IF NOT EXISTS idx_upload_jobs_user_status ON upload_jobs(user_id, status);
    `);

    const adminCheck = await client.query('SELECT id FROM users WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      const userResult = await client.query(`
        INSERT INTO users (username, email, password, first_name, last_name, is_staff, is_professor)
        VALUES ($1, $2, $3, $4, $5, true, true)
        RETURNING id
      `, ['admin', 'admin@rms.com', hashedPassword, 'Admin', 'User']);
      
      await client.query(`
        INSERT INTO professors (user_id, empid, email, first_name, last_name)
        VALUES ($1, $2, $3, $4, $5)
      `, [userResult.rows[0].id, 'admin', 'admin@rms.com', 'Admin', 'User']);
    }

    const branchCheck = await client.query('SELECT id FROM branches LIMIT 1');
    if (branchCheck.rows.length === 0) {
      const branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE'];
      for (const b of branches) {
        await client.query('INSERT INTO branches (branch) VALUES ($1) ON CONFLICT DO NOTHING', [b]);
      }
    }

    const batchCheck = await client.query('SELECT id FROM batches LIMIT 1');
    if (batchCheck.rows.length === 0) {
      const batches = [2019, 2020, 2021, 2022, 2023, 2024];
      for (const b of batches) {
        await client.query('INSERT INTO batches (batch) VALUES ($1) ON CONFLICT DO NOTHING', [b]);
      }
    }

    console.log('PostgreSQL database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  } finally {
    client.release();
  }
}
