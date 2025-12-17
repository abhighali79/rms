import { getDb } from '../database/init.js';
import bcrypt from 'bcryptjs';

export const User = {
  findByUsername: (username) => {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  findByEmail: (email) => {
    const db = getDb();
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },

  create: (userData) => {
    const db = getDb();
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    
    const result = db.prepare(`
      INSERT INTO users (username, email, password, first_name, last_name, is_student, is_professor)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      userData.username,
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name,
      userData.is_student ? 1 : 0,
      userData.is_professor ? 1 : 0
    );
    
    return { id: result.lastInsertRowid, ...userData };
  },

  verifyPassword: (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
};

export const Student = {
  create: (studentData) => {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO students (user_id, usn, batch_id, branch_id, email, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      studentData.user_id,
      studentData.usn,
      studentData.batch_id,
      studentData.branch_id,
      studentData.email,
      studentData.first_name,
      studentData.last_name
    );
    return { id: result.lastInsertRowid, ...studentData };
  },

  findByUsn: (usn) => {
    const db = getDb();
    return db.prepare('SELECT * FROM students WHERE usn = ?').get(usn);
  },

  findByUserId: (userId) => {
    const db = getDb();
    return db.prepare('SELECT * FROM students WHERE user_id = ?').get(userId);
  },

  getAll: () => {
    const db = getDb();
    return db.prepare(`
      SELECT s.*, b.branch as branch_name, bt.batch as batch_year
      FROM students s
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN batches bt ON s.batch_id = bt.id
    `).all();
  }
};

export const Professor = {
  create: (professorData) => {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO professors (user_id, empid, department_id, email, first_name, last_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      professorData.user_id,
      professorData.empid,
      professorData.department_id,
      professorData.email,
      professorData.first_name,
      professorData.last_name
    );
    return { id: result.lastInsertRowid, ...professorData };
  },

  findByEmpId: (empid) => {
    const db = getDb();
    return db.prepare('SELECT * FROM professors WHERE empid = ?').get(empid);
  },

  findByUserId: (userId) => {
    const db = getDb();
    return db.prepare('SELECT * FROM professors WHERE user_id = ?').get(userId);
  }
};

export const Branch = {
  getAll: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM branches').all();
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT * FROM branches WHERE id = ?').get(id);
  },

  create: (branch) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO branches (branch) VALUES (?)').run(branch);
    return { id: result.lastInsertRowid, branch };
  },

  delete: (id) => {
    const db = getDb();
    return db.prepare('DELETE FROM branches WHERE id = ?').run(id);
  }
};

export const Batch = {
  getAll: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM batches ORDER BY batch DESC').all();
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT * FROM batches WHERE id = ?').get(id);
  },

  create: (batch) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO batches (batch) VALUES (?)').run(batch);
    return { id: result.lastInsertRowid, batch };
  },

  delete: (id) => {
    const db = getDb();
    return db.prepare('DELETE FROM batches WHERE id = ?').run(id);
  }
};
