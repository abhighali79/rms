import jwt from 'jsonwebtoken';
import { User, Student, Professor, Branch, Batch } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

export const registerStudent = async (req, res) => {
  try {
    const { usn, email, password, first_name, last_name, batch_id, branch_id } = req.body;

    if (!usn || !password || !batch_id || !branch_id) {
      return res.status(400).json({ error: 'USN, password, batch and branch are required' });
    }

    const existingUser = User.findByUsername(usn);
    if (existingUser) {
      return res.status(400).json({ error: 'USN already registered' });
    }

    const user = User.create({
      username: usn,
      email,
      password,
      first_name,
      last_name,
      is_student: true,
      is_professor: false
    });

    Student.create({
      user_id: user.id,
      usn,
      batch_id,
      branch_id,
      email,
      first_name,
      last_name
    });

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const registerProfessor = async (req, res) => {
  try {
    const { empid, email, password, first_name, last_name, department_id } = req.body;

    if (!empid || !password) {
      return res.status(400).json({ error: 'Employee ID and password are required' });
    }

    const existingUser = User.findByUsername(empid);
    if (existingUser) {
      return res.status(400).json({ error: 'Employee ID already registered' });
    }

    const user = User.create({
      username: empid,
      email,
      password,
      first_name,
      last_name,
      is_student: false,
      is_professor: true
    });

    Professor.create({
      user_id: user.id,
      empid,
      department_id,
      email,
      first_name,
      last_name
    });

    res.status(201).json({ message: 'Professor registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = User.findByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!User.verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (role === 'student' && !user.is_student) {
      return res.status(401).json({ error: 'Not a student account' });
    }

    if (role === 'professor' && !user.is_professor) {
      return res.status(401).json({ error: 'Not a professor account' });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        is_student: user.is_student,
        is_professor: user.is_professor,
        is_staff: user.is_staff
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    let profile = null;
    if (user.is_student) {
      profile = Student.findByUserId(user.id);
    } else if (user.is_professor) {
      profile = Professor.findByUserId(user.id);
    }

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        is_student: user.is_student,
        is_professor: user.is_professor,
        is_staff: user.is_staff,
        profile
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let profile = null;
    if (user.is_student) {
      profile = Student.findByUserId(user.id);
    } else if (user.is_professor) {
      profile = Professor.findByUserId(user.id);
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      is_student: user.is_student,
      is_professor: user.is_professor,
      is_staff: user.is_staff,
      profile
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const getBranches = async (req, res) => {
  try {
    const branches = Branch.getAll();
    res.json(branches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get branches' });
  }
};

export const getBatches = async (req, res) => {
  try {
    const batches = Batch.getAll();
    res.json(batches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get batches' });
  }
};
