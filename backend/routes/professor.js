import express from 'express';
import {
  getDashboard,
  getBatchesByBranch,
  getSemestersByBranchBatch,
  getResultAnalytics,
  downloadReport,
  addBranch,
  addBatch
} from '../controllers/professorController.js';
import { authenticateToken, requireProfessor } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireProfessor);

router.get('/dashboard', getDashboard);
router.get('/batches/:branchId', getBatchesByBranch);
router.get('/semesters/:branchId/:batchId', getSemestersByBranchBatch);
router.get('/analytics/:branchId/:batchId/:sem', getResultAnalytics);
router.get('/download/:branchId/:batchId/:sem', downloadReport);
router.post('/branch', addBranch);
router.post('/batch', addBatch);

export default router;
