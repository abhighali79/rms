import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

export const requireStudent = (req, res, next) => {
  if (!req.user.is_student) {
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
};

export const requireProfessor = (req, res, next) => {
  if (!req.user.is_professor) {
    return res.status(403).json({ error: 'Professor access required' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.user.is_staff) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
