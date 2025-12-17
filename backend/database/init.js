import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'rms.db');

let db;

export function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export function initDatabase() {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS branches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      branch TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS batches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch INTEGER UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      is_active INTEGER DEFAULT 1,
      is_staff INTEGER DEFAULT 0,
      is_student INTEGER DEFAULT 0,
      is_professor INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      usn TEXT UNIQUE NOT NULL,
      batch_id INTEGER,
      branch_id INTEGER,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS professors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      empid TEXT UNIQUE NOT NULL,
      department_id INTEGER,
      email TEXT,
      first_name TEXT,
      last_name TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (department_id) REFERENCES branches(id)
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      sem INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    CREATE TABLE IF NOT EXISTS marks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      sem INTEGER NOT NULL,
      batch_id INTEGER NOT NULL,
      branch_id INTEGER NOT NULL,
      subject_code TEXT NOT NULL,
      subject_name TEXT DEFAULT '',
      internal TEXT,
      external TEXT,
      total TEXT,
      result TEXT,
      announced_date TEXT DEFAULT '',
      attempts INTEGER DEFAULT 1,
      original_sem INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (batch_id) REFERENCES batches(id),
      FOREIGN KEY (branch_id) REFERENCES branches(id),
      UNIQUE(user_id, subject_code, sem)
    );

    CREATE TABLE IF NOT EXISTS upload_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      result_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.prepare(`
      INSERT INTO users (username, email, password, first_name, last_name, is_staff, is_professor)
      VALUES (?, ?, ?, ?, ?, 1, 1)
    `).run('admin', 'admin@rms.com', hashedPassword, 'Admin', 'User');

    const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    db.prepare(`
      INSERT INTO professors (user_id, empid, email, first_name, last_name)
      VALUES (?, ?, ?, ?, ?)
    `).run(adminUser.id, 'admin', 'admin@rms.com', 'Admin', 'User');
  }

  const branchExists = db.prepare('SELECT id FROM branches LIMIT 1').get();
  if (!branchExists) {
    const branches = ['CSE', 'ECE', 'MECH', 'CIVIL', 'EEE'];
    const insertBranch = db.prepare('INSERT OR IGNORE INTO branches (branch) VALUES (?)');
    branches.forEach(b => insertBranch.run(b));
  }

  const batchExists = db.prepare('SELECT id FROM batches LIMIT 1').get();
  if (!batchExists) {
    const batches = [2019, 2020, 2021, 2022, 2023, 2024];
    const insertBatch = db.prepare('INSERT OR IGNORE INTO batches (batch) VALUES (?)');
    batches.forEach(b => insertBatch.run(b));
  }

  // Migration: Add announced_date column if it doesn't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(marks)").all();
    const hasAnnouncedDate = tableInfo.some(col => col.name === 'announced_date');
    if (!hasAnnouncedDate) {
      db.exec("ALTER TABLE marks ADD COLUMN announced_date TEXT DEFAULT ''");
      console.log('Added announced_date column to marks table');
    }
  } catch (err) {
    console.log('Migration check for announced_date:', err.message);
  }

  // Migration: Add attempts and original_sem columns if they don't exist
  try {
    const tableInfo = db.prepare("PRAGMA table_info(marks)").all();
    const hasAttempts = tableInfo.some(col => col.name === 'attempts');
    if (!hasAttempts) {
      db.exec("ALTER TABLE marks ADD COLUMN attempts INTEGER DEFAULT 1");
      console.log('Added attempts column to marks table');
    }
    const hasOriginalSem = tableInfo.some(col => col.name === 'original_sem');
    if (!hasOriginalSem) {
      db.exec("ALTER TABLE marks ADD COLUMN original_sem INTEGER");
      console.log('Added original_sem column to marks table');
    }
  } catch (err) {
    console.log('Migration check for attempts/original_sem:', err.message);
  }

  console.log('Database initialized successfully');
}
