import express from 'express';
import {
  getAllStudents,
  getStudentMarks,
  updateMark,
  deleteMark,
  deleteStudent,
  deleteBranch,
  deleteBatch,
  getStats
} from '../controllers/adminController.js';
import { authenticateToken, requireProfessor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireProfessor);

router.get('/students', getAllStudents);
router.get('/students/:userId/marks', getStudentMarks);
router.put('/marks/:id', updateMark);
router.delete('/marks/:id', deleteMark);
router.delete('/students/:userId', deleteStudent);
router.delete('/branches/:id', deleteBranch);
router.delete('/batches/:id', deleteBatch);
router.get('/stats', getStats);

export default router;
