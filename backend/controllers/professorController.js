import { Marks, Document } from '../models/MarksPg.js';
import { Branch, Batch, Student } from '../models/UserPg.js';
import { query } from '../database/pg.js';

export const getDashboard = async (req, res) => {
  try {
    const branches = await Branch.getAll();
    
    const branchStats = {};
    for (const branch of branches) {
      const result = await query(`
        SELECT COUNT(*) as count FROM students WHERE branch_id = $1
      `, [branch.id]);
      branchStats[branch.branch] = parseInt(result.rows[0].count);
    }

    res.json({
      branches,
      branchStats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
};

export const getBatchesByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;
    const batches = await Batch.getAll();

    const batchStats = {};
    for (const batch of batches) {
      const result = await query(`
        SELECT COUNT(*) as count FROM students 
        WHERE batch_id = $1 AND branch_id = $2
      `, [batch.id, branchId]);
      batchStats[batch.batch] = parseInt(result.rows[0].count);
    }

    res.json({
      batches,
      batchStats,
      branchId: parseInt(branchId)
    });
  } catch (error) {
    console.error('Batches error:', error);
    res.status(500).json({ error: 'Failed to get batches' });
  }
};

export const getSemestersByBranchBatch = async (req, res) => {
  try {
    const { branchId, batchId } = req.params;
    const semesters = await Marks.getSemestersByBranchBatch(branchId, batchId);
    
    const totalStudentsResult = await query(`
      SELECT COUNT(*) as count FROM students 
      WHERE batch_id = $1 AND branch_id = $2
    `, [batchId, branchId]);

    const semesterStats = {};
    for (const s of semesters) {
      const count = await Document.countByBranchBatchSem(branchId, batchId, s.sem);
      semesterStats[s.sem] = parseInt(count.count);
    }

    res.json({
      semesters: semesters.map(s => s.sem),
      semesterStats,
      totalStudents: parseInt(totalStudentsResult.rows[0].count),
      branchId: parseInt(branchId),
      batchId: parseInt(batchId)
    });
  } catch (error) {
    console.error('Semesters error:', error);
    res.status(500).json({ error: 'Failed to get semesters' });
  }
};

export const getResultAnalytics = async (req, res) => {
  try {
    const { branchId, batchId, sem } = req.params;
    const analytics = await Marks.getAnalytics(branchId, batchId, sem);
    
    const branch = await Branch.findById(branchId);
    const batch = await Batch.findById(batchId);

    res.json({
      ...analytics,
      branch: branch?.branch,
      batch: batch?.batch,
      sem: parseInt(sem)
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

export const downloadReport = async (req, res) => {
  try {
    const { branchId, batchId, sem } = req.params;
    const analytics = await Marks.getAnalytics(branchId, batchId, sem);
    
    const branch = await Branch.findById(branchId);
    const batch = await Batch.findById(batchId);

    res.json({
      ...analytics,
      branch: branch?.branch,
      batch: batch?.batch,
      sem: parseInt(sem),
      exportData: true
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

export const addBranch = async (req, res) => {
  try {
    const { branch } = req.body;
    if (!branch) {
      return res.status(400).json({ error: 'Branch name is required' });
    }

    const existing = await query('SELECT id FROM branches WHERE branch = $1', [branch]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Branch already exists' });
    }

    const result = await Branch.create(branch);
    res.status(201).json({ message: 'Branch added successfully', branch: result });
  } catch (error) {
    console.error('Add branch error:', error);
    res.status(500).json({ error: 'Failed to add branch' });
  }
};

export const addBatch = async (req, res) => {
  try {
    const { batch } = req.body;
    if (!batch) {
      return res.status(400).json({ error: 'Batch year is required' });
    }

    const existing = await query('SELECT id FROM batches WHERE batch = $1', [batch]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Batch already exists' });
    }

    const result = await Batch.create(parseInt(batch));
    res.status(201).json({ message: 'Batch added successfully', batch: result });
  } catch (error) {
    console.error('Add batch error:', error);
    res.status(500).json({ error: 'Failed to add batch' });
  }
};
