import { Student, Branch, Batch } from '../models/User.js';
import { Marks } from '../models/Marks.js';
import { getDb } from '../database/init.js';

export const getAllStudents = async (req, res) => {
  try {
    const students = Student.getAll();
    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Failed to get students' });
  }
};

export const getStudentMarks = async (req, res) => {
  try {
    const { userId } = req.params;
    const marks = Marks.findByUser(userId);
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
    const db = getDb();
    
    db.prepare(`
      UPDATE marks SET internal = ?, external = ?, total = ?, result = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(internal, external, total, result, id);

    res.json({ message: 'Mark updated successfully' });
  } catch (error) {
    console.error('Update mark error:', error);
    res.status(500).json({ error: 'Failed to update mark' });
  }
};

export const deleteMark = async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDb();
    db.prepare('DELETE FROM marks WHERE id = ?').run(id);
    res.json({ message: 'Mark deleted successfully' });
  } catch (error) {
    console.error('Delete mark error:', error);
    res.status(500).json({ error: 'Failed to delete mark' });
  }
};

export const deleteStudent = async (req, res) => {
  try {
    const { userId } = req.params;
    const db = getDb();
    
    db.prepare('DELETE FROM marks WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM documents WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM students WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;
    Branch.delete(id);
    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
};

export const deleteBatch = async (req, res) => {
  try {
    const { id } = req.params;
    Batch.delete(id);
    res.json({ message: 'Batch deleted successfully' });
  } catch (error) {
    console.error('Delete batch error:', error);
    res.status(500).json({ error: 'Failed to delete batch' });
  }
};

export const getStats = async (req, res) => {
  try {
    const db = getDb();
    const totalStudents = db.prepare('SELECT COUNT(*) as count FROM students').get();
    const totalProfessors = db.prepare('SELECT COUNT(*) as count FROM professors').get();
    const totalBranches = db.prepare('SELECT COUNT(*) as count FROM branches').get();
    const totalBatches = db.prepare('SELECT COUNT(*) as count FROM batches').get();
    const totalMarks = db.prepare('SELECT COUNT(*) as count FROM marks').get();
    const totalDocuments = db.prepare('SELECT COUNT(*) as count FROM documents').get();

    res.json({
      students: parseInt(totalStudents.count),
      professors: parseInt(totalProfessors.count),
      branches: parseInt(totalBranches.count),
      batches: parseInt(totalBatches.count),
      marks: parseInt(totalMarks.count),
      documents: parseInt(totalDocuments.count)
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
};
