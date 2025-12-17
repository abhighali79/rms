import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  uploadResult,
  getMyMarks,
  getMyDocuments,
  getUploadStatus
} from '../controllers/studentController.js';
import { authenticateToken, requireStudent } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

const router = express.Router();

router.use(authenticateToken);
router.use(requireStudent);

router.post('/upload', upload.single('file'), uploadResult);
router.get('/marks', getMyMarks);
router.get('/documents', getMyDocuments);
router.get('/upload-status', getUploadStatus);

export default router;
