import { Student, Branch, Batch } from '../models/UserPg.js';
import { Marks } from '../models/MarksPg.js';
import { query } from '../database/pg.js';

export const getAllStudents = async (req, res) => {
  try {
    const students = await Student.getAll();
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
};

export const getStudentMarks = async (req, res) => {
  try {
    const { userId } = req.params;
    const marks = await Marks.findByUser(userId);
    res.json(marks);
  } catch (error) {
    console.error('Get student marks error:', error);
    res.status(500).json({ error: 'Failed to get student marks' });
  }
};

export const updateMark = async (req, res) => {
  try {
    const { id } = req.params;
    const { internal, external, total, result } = req.body;
    
    await query(`
      UPDATE marks SET internal = $1, external = $2, total = $3, result = $4, updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
    `, [internal, external, total, result, id]);

    res.json({ message: 'Mark updated successfully' });
  } catch (error) {
    console.error('Update mark error:', error);
    res.status(500).json({ error: 'Failed to update mark' });
  }
};

export const deleteMark = async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM marks WHERE id = $1', [id]);
    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    console.error('Delete mark error:', error);
    res.status(500).json({ error: 'Failed to delete mark' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await query('DELETE FROM marks WHERE user_id = $1', [userId]);
    await query('DELETE FROM documents WHERE user_id = $1', [userId]);
    await query('DELETE FROM students WHERE user_id = $1', [userId]);
    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    await Branch.delete(id);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    await Batch.delete(id);
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
};

export const getStats = async (req, res) => {
  try {
    const totalStudents = await query('SELECT COUNT(*) as count FROM students');
    const totalProfessors = await query('SELECT COUNT(*) as count FROM professors');
    const totalBranches = await query('SELECT COUNT(*) as count FROM branches');
    const totalBatches = await query('SELECT COUNT(*) as count FROM batches');
    const totalMarks = await query('SELECT COUNT(*) as count FROM marks');
    const totalDocuments = await query('SELECT COUNT(*) as count FROM documents');

    res.json({
      students: parseInt(totalStudents.rows[0].count),
      professors: parseInt(totalProfessors.rows[0].count),
      branches: parseInt(totalBranches.rows[0].count),
      batches: parseInt(totalBatches.rows[0].count),
      marks: parseInt(totalMarks.rows[0].count),
      documents: parseInt(totalDocuments.rows[0].count)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};
