import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import studentRoutes from './routes/student.js';
import professorRoutes from './routes/professor.js';
import adminRoutes from './routes/admin.js';
import { initDatabase } from './database/pg.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.set('trust proxy', 1);
app.use(compression());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many uploads, please wait a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
app.use('/api/student/upload', uploadLimiter);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

(async () => {
  try {
    await initDatabase();
  } catch (err) {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  }
})();

app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/professor', professorRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', database: 'PostgreSQL' });
});

const frontendDistPath = path.join(__dirname, '../frontend/dist');

if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend server running on port ${PORT}`);
});
