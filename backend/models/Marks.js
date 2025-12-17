import { getDb } from '../database/init.js';

export const Marks = {
  create: (markData) => {
    const db = getDb();
    const result = db.prepare(`
      INSERT OR REPLACE INTO marks (user_id, name, sem, batch_id, branch_id, subject_code, subject_name, internal, external, total, result, announced_date, attempts, original_sem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      markData.user_id,
      markData.name,
      markData.sem,
      markData.batch_id,
      markData.branch_id,
      markData.subject_code,
      markData.subject_name || '',
      markData.internal,
      markData.external,
      markData.total,
      markData.result,
      markData.announced_date || '',
      markData.attempts || 1,
      markData.original_sem || null
    );
    return { id: result.lastInsertRowid, ...markData };
  },

  createBatch: (marksArray) => {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO marks (user_id, name, sem, batch_id, branch_id, subject_code, subject_name, internal, external, total, result, announced_date, attempts, original_sem)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertMany = db.transaction((marks) => {
      for (const markData of marks) {
        stmt.run(
          markData.user_id,
          markData.name,
          markData.sem,
          markData.batch_id,
          markData.branch_id,
          markData.subject_code,
          markData.subject_name || '',
          markData.internal,
          markData.external,
          markData.total,
          markData.result,
          markData.announced_date || '',
          markData.attempts || 1,
          markData.original_sem || null
        );
      }
    });
    
    insertMany(marksArray);
  },

  findSubjectByUser: (userId, subjectCode) => {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM marks 
      WHERE user_id = ? AND subject_code = ?
      ORDER BY sem ASC
      LIMIT 1
    `).get(userId, subjectCode);
  },

  findFailedSubjectByUser: (userId, subjectCode) => {
    const db = getDb();
    return db.prepare(`
      SELECT * FROM marks 
      WHERE user_id = ? AND subject_code = ? AND result = 'F'
      ORDER BY sem ASC
      LIMIT 1
    `).get(userId, subjectCode);
  },

  updateBacklogCleared: (markId, newData) => {
    const db = getDb();
    return db.prepare(`
      UPDATE marks 
      SET internal = ?, external = ?, total = ?, result = 'P', 
          attempts = ?, announced_date = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      newData.internal,
      newData.external,
      newData.total,
      newData.attempts,
      newData.announced_date || '',
      markId
    );
  },

  updateAttemptCount: (markId, attempts) => {
    const db = getDb();
    return db.prepare(`
      UPDATE marks 
      SET attempts = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(attempts, markId);
  },

  findByUserAndSem: (userId, sem) => {
    const db = getDb();
    return db.prepare(`
      SELECT m.*, b.branch as branch_name, bt.batch as batch_year
      FROM marks m
      LEFT JOIN branches b ON m.branch_id = b.id
      LEFT JOIN batches bt ON m.batch_id = bt.id
      WHERE m.user_id = ? AND m.sem = ?
    `).all(userId, sem);
  },

  findByUser: (userId) => {
    const db = getDb();
    return db.prepare(`
      SELECT m.*, b.branch as branch_name, bt.batch as batch_year
      FROM marks m
      LEFT JOIN branches b ON m.branch_id = b.id
      LEFT JOIN batches bt ON m.batch_id = bt.id
      WHERE m.user_id = ?
      ORDER BY m.sem
    `).all(userId);
  },

  getSemestersByUser: (userId) => {
    const db = getDb();
    return db.prepare('SELECT DISTINCT sem FROM marks WHERE user_id = ? ORDER BY sem').all(userId);
  },

  getByBranchBatchSem: (branchId, batchId, sem) => {
    const db = getDb();
    return db.prepare(`
      SELECT m.*, u.username as usn, b.branch as branch_name, bt.batch as batch_year
      FROM marks m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN branches b ON m.branch_id = b.id
      LEFT JOIN batches bt ON m.batch_id = bt.id
      WHERE m.branch_id = ? AND m.batch_id = ? AND m.sem = ?
      ORDER BY u.username ASC
    `).all(branchId, batchId, sem);
  },

  getSubjectsByBranchBatchSem: (branchId, batchId, sem) => {
    const db = getDb();
    return db.prepare(`
      SELECT DISTINCT subject_code FROM marks
      WHERE branch_id = ? AND batch_id = ? AND sem = ?
    `).all(branchId, batchId, sem);
  },

  getSemestersByBranchBatch: (branchId, batchId) => {
    const db = getDb();
    return db.prepare(`
      SELECT DISTINCT sem FROM marks
      WHERE branch_id = ? AND batch_id = ?
      ORDER BY sem
    `).all(branchId, batchId);
  },

  getStudentCountByBranchBatch: (branchId, batchId) => {
    const db = getDb();
    return db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM marks
      WHERE branch_id = ? AND batch_id = ?
    `).get(branchId, batchId);
  },

  getAnalytics: (branchId, batchId, sem) => {
    const db = getDb();
    const marks = db.prepare(`
      SELECT m.*, u.username as usn
      FROM marks m
      JOIN users u ON m.user_id = u.id
      WHERE m.branch_id = ? AND m.batch_id = ? AND m.sem = ?
    `).all(branchId, batchId, sem);

    const studentData = {};
    const subjectStats = {};

    marks.forEach(m => {
      if (!studentData[m.usn]) {
        studentData[m.usn] = {
          usn: m.usn,
          name: m.name,
          subjects: {},
          total: 0,
          subjectCount: 0
        };
      }

      studentData[m.usn].subjects[m.subject_code] = {
        internal: m.internal,
        external: m.external,
        total: m.total,
        result: m.result
      };

      const totalNum = parseInt(m.total) || 0;
      studentData[m.usn].total += totalNum;
      studentData[m.usn].subjectCount++;

      if (!subjectStats[m.subject_code]) {
        subjectStats[m.subject_code] = { total: 0, pass: 0, fail: 0 };
      }
      subjectStats[m.subject_code].total++;
      if (m.result === 'P') {
        subjectStats[m.subject_code].pass++;
      } else if (m.result === 'F') {
        subjectStats[m.subject_code].fail++;
      }
    });

    const classStats = { FCD: 0, FC: 0, SC: 0, Fail: 0 };
    const tableData = [];

    Object.entries(studentData).forEach(([usn, data]) => {
      const percentage = data.subjectCount > 0 ? data.total / data.subjectCount : 0;
      let classGrade = 'Fail';
      
      if (percentage >= 80) {
        classGrade = 'FCD';
        classStats.FCD++;
      } else if (percentage >= 60) {
        classGrade = 'FC';
        classStats.FC++;
      } else if (percentage >= 40) {
        classGrade = 'SC';
        classStats.SC++;
      } else {
        classStats.Fail++;
      }

      tableData.push({
        usn,
        name: data.name,
        subjects: data.subjects,
        total: data.total,
        percentage: percentage.toFixed(2),
        result: percentage >= 40 ? 'Pass' : 'Fail',
        class: classGrade
      });
    });

    // Get toppers first (sorted by percentage descending)
    const sortedByPercentage = [...tableData].sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    const toppers = sortedByPercentage.slice(0, 3).map((s, i) => ({
      rank: i + 1,
      usn: s.usn,
      name: s.name,
      percentage: s.percentage
    }));

    // Sort main table by USN in ascending order
    tableData.sort((a, b) => a.usn.localeCompare(b.usn));

    Object.keys(subjectStats).forEach(code => {
      const stat = subjectStats[code];
      stat.percentage = stat.total > 0 ? ((stat.pass / stat.total) * 100).toFixed(2) : 0;
    });

    return {
      tableData,
      subjectStats,
      classStats,
      toppers,
      totalStudents: tableData.length
    };
  }
};

export const Document = {
  create: (docData) => {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO documents (user_id, sem, branch_id, batch_id, file_path)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      docData.user_id,
      docData.sem,
      docData.branch_id,
      docData.batch_id,
      docData.file_path
    );
    return { id: result.lastInsertRowid, ...docData };
  },

  findByUser: (userId) => {
    const db = getDb();
    return db.prepare(`
      SELECT d.*, b.branch as branch_name, bt.batch as batch_year
      FROM documents d
      LEFT JOIN branches b ON d.branch_id = b.id
      LEFT JOIN batches bt ON d.batch_id = bt.id
      WHERE d.user_id = ?
      ORDER BY d.uploaded_at DESC
    `).all(userId);
  },

  countByBranchBatchSem: (branchId, batchId, sem) => {
    const db = getDb();
    return db.prepare(`
      SELECT COUNT(*) as count FROM documents
      WHERE branch_id = ? AND batch_id = ? AND sem = ?
    `).get(branchId, batchId, sem);
  }
};
