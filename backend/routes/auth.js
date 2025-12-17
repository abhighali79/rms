import express from 'express';
import { 
  registerStudent, 
  registerProfessor, 
  login, 
  getProfile,
  getBranches,
  getBatches
} from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register/student', registerStudent);
router.post('/register/professor', registerProfessor);
router.post('/login', login);
router.get('/profile', authenticateToken, getProfile);
router.get('/branches', getBranches);
router.get('/batches', getBatches);

export default router;
