import { query } from '../database/pg.js';
import bcrypt from 'bcryptjs';

export const User = {
  findByUsername: async (username) => {
    const result = await query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0] || null;
  },

  findById: async (id) => {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  findByEmail: async (email) => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  },

  create: async (userData) => {
    const hashedPassword = bcrypt.hashSync(userData.password, 10);
    const result = await query(`
      INSERT INTO users (username, email, password, first_name, last_name, is_student, is_professor)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      userData.username,
      userData.email,
      hashedPassword,
      userData.first_name,
      userData.last_name,
      userData.is_student || false,
      userData.is_professor || false
    ]);
    return result.rows[0];
  },

  verifyPassword: (plainPassword, hashedPassword) => {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }
};

export const Student = {
  create: async (studentData) => {
    const result = await query(`
      INSERT INTO students (user_id, usn, batch_id, branch_id, email, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      studentData.user_id,
      studentData.usn,
      studentData.batch_id,
      studentData.branch_id,
      studentData.email,
      studentData.first_name,
      studentData.last_name
    ]);
    return result.rows[0];
  },

  findByUsn: async (usn) => {
    const result = await query('SELECT * FROM students WHERE usn = $1', [usn]);
    return result.rows[0] || null;
  },

  findByUserId: async (userId) => {
    const result = await query('SELECT * FROM students WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  },

  getAll: async () => {
    const result = await query(`
      SELECT s.*, b.branch as branch_name, bt.batch as batch_year
      FROM students s
      LEFT JOIN branches b ON s.branch_id = b.id
      LEFT JOIN batches bt ON s.batch_id = bt.id
    `);
    return result.rows;
  }
};

export const Professor = {
  create: async (professorData) => {
    const result = await query(`
      INSERT INTO professors (user_id, empid, department_id, email, first_name, last_name)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      professorData.user_id,
      professorData.empid,
      professorData.department_id,
      professorData.email,
      professorData.first_name,
      professorData.last_name
    ]);
    return result.rows[0];
  },

  findByEmpId: async (empid) => {
    const result = await query('SELECT * FROM professors WHERE empid = $1', [empid]);
    return result.rows[0] || null;
  },

  findByUserId: async (userId) => {
    const result = await query('SELECT * FROM professors WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }
};

export const Branch = {
  getAll: async () => {
    const result = await query('SELECT * FROM branches');
    return result.rows;
  },

  findById: async (id) => {
    const result = await query('SELECT * FROM branches WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (branch) => {
    const result = await query('INSERT INTO branches (branch) VALUES ($1) RETURNING *', [branch]);
    return result.rows[0];
  },

  delete: async (id) => {
    await query('DELETE FROM branches WHERE id = $1', [id]);
  }
};

export const Batch = {
  getAll: async () => {
    const result = await query('SELECT * FROM batches ORDER BY batch DESC');
    return result.rows;
  },

  findById: async (id) => {
    const result = await query('SELECT * FROM batches WHERE id = $1', [id]);
    return result.rows[0] || null;
  },

  create: async (batch) => {
    const result = await query('INSERT INTO batches (batch) VALUES ($1) RETURNING *', [batch]);
    return result.rows[0];
  },

  delete: async (id) => {
    await query('DELETE FROM batches WHERE id = $1', [id]);
  }
};
