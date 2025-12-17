import { query, getClient } from '../database/pg.js';

export const Marks = {
  create: async (markData) => {
    const result = await query(`
      INSERT INTO marks (user_id, name, sem, batch_id, branch_id, subject_code, subject_name, internal, external, total, result, announced_date, attempts, original_sem)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (user_id, subject_code, sem) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        internal = EXCLUDED.internal,
        external = EXCLUDED.external,
        total = EXCLUDED.total,
        result = EXCLUDED.result,
        announced_date = EXCLUDED.announced_date,
        attempts = EXCLUDED.attempts,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `, [
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
    ]);
    return result.rows[0];
  },

  createBatch: async (marksArray) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');
      const results = [];
      for (const markData of marksArray) {
        const result = await client.query(`
          INSERT INTO marks (user_id, name, sem, batch_id, branch_id, subject_code, subject_name, internal, external, total, result, announced_date, attempts, original_sem)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (user_id, subject_code, sem) 
          DO UPDATE SET 
            name = EXCLUDED.name,
            internal = EXCLUDED.internal,
            external = EXCLUDED.external,
            total = EXCLUDED.total,
            result = EXCLUDED.result,
            announced_date = EXCLUDED.announced_date,
            attempts = EXCLUDED.attempts,
            updated_at = CURRENT_TIMESTAMP
          RETURNING *
        `, [
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
        ]);
        results.push(result.rows[0]);
      }
      await client.query('COMMIT');
      return results;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  findSubjectByUser: async (userId, subjectCode) => {
    const result = await query(`
      SELECT * FROM marks 
      WHERE user_id = $1 AND subject_code = $2
      ORDER BY sem ASC
      LIMIT 1
    `, [userId, subjectCode]);
    return result.rows[0] || null;
  },

  findFailedSubjectByUser: async (userId, subjectCode) => {
    const result = await query(`
      SELECT * FROM marks 
      WHERE user_id = $1 AND subject_code = $2 AND result = 'F'
      ORDER BY sem ASC
      LIMIT 1
    `, [userId, subjectCode]);
    return result.rows[0] || null;
  },

  updateBacklogCleared: async (markId, newData) => {
    await query(`
      UPDATE marks 
      SET internal = $1, external = $2, total = $3, result = 'P', 
          attempts = $4, announced_date = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
    `, [
      newData.internal,
      newData.external,
      newData.total,
      newData.attempts,
      newData.announced_date || '',
      markId
    ]);
  },

  updateAttemptCount: async (markId, attempts) => {
    await query(`
      UPDATE marks 
      SET attempts = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `, [attempts, markId]);
  },

  findByUserAndSem: async (userId, sem) => {
    const result = await query(`
      SELECT m.*, b.branch as branch_name, bt.batch as batch_year
      FROM marks m
      LEFT JOIN branches b ON m.branch_id = b.id
      LEFT JOIN batches bt ON m.batch_id = bt.id
      WHERE m.user_id = $1 AND m.sem = $2
    `, [userId, sem]);
    return result.rows;
  },

  findByUser: async (userId) => {
    const result = await query(`
      SELECT m.*, b.branch as branch_name, bt.batch as batch_year
      FROM marks m
      LEFT JOIN branches b ON m.branch_id = b.id
      LEFT JOIN batches bt ON m.batch_id = bt.id
      WHERE m.user_id = $1
      ORDER BY m.sem
    `, [userId]);
    return result.rows;
  },

  getSemestersByUser: async (userId) => {
    const result = await query('SELECT DISTINCT sem FROM marks WHERE user_id = $1 ORDER BY sem', [userId]);
    return result.rows;
  },

  getByBranchBatchSem: async (branchId, batchId, sem) => {
    const result = await query(`
      SELECT m.*, u.username as usn, b.branch as branch_name, bt.batch as batch_year
      FROM marks m
      JOIN users u ON m.user_id = u.id
      LEFT JOIN branches b ON m.branch_id = b.id
      LEFT JOIN batches bt ON m.batch_id = bt.id
      WHERE m.branch_id = $1 AND m.batch_id = $2 AND m.sem = $3
      ORDER BY u.username ASC
    `, [branchId, batchId, sem]);
    return result.rows;
  },

  getSubjectsByBranchBatchSem: async (branchId, batchId, sem) => {
    const result = await query(`
      SELECT DISTINCT subject_code FROM marks
      WHERE branch_id = $1 AND batch_id = $2 AND sem = $3
    `, [branchId, batchId, sem]);
    return result.rows;
  },

  getSemestersByBranchBatch: async (branchId, batchId) => {
    const result = await query(`
      SELECT DISTINCT sem FROM marks
      WHERE branch_id = $1 AND batch_id = $2
      ORDER BY sem
    `, [branchId, batchId]);
    return result.rows;
  },

  getStudentCountByBranchBatch: async (branchId, batchId) => {
    const result = await query(`
      SELECT COUNT(DISTINCT user_id) as count FROM marks
      WHERE branch_id = $1 AND batch_id = $2
    `, [branchId, batchId]);
    return result.rows[0];
  },

  getAnalytics: async (branchId, batchId, sem) => {
    const result = await query(`
      SELECT m.*, u.username as usn
      FROM marks m
      JOIN users u ON m.user_id = u.id
      WHERE m.branch_id = $1 AND m.batch_id = $2 AND m.sem = $3
    `, [branchId, batchId, sem]);
    const marks = result.rows;

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

    const sortedByPercentage = [...tableData].sort((a, b) => parseFloat(b.percentage) - parseFloat(a.percentage));
    const toppers = sortedByPercentage.slice(0, 3).map((s, i) => ({
      rank: i + 1,
      usn: s.usn,
      name: s.name,
      percentage: s.percentage
    }));

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
  create: async (docData) => {
    const result = await query(`
      INSERT INTO documents (user_id, sem, branch_id, batch_id, file_path)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [
      docData.user_id,
      docData.sem,
      docData.branch_id,
      docData.batch_id,
      docData.file_path
    ]);
    return result.rows[0];
  },

  findByUser: async (userId) => {
    const result = await query(`
      SELECT d.*, b.branch as branch_name, bt.batch as batch_year
      FROM documents d
      LEFT JOIN branches b ON d.branch_id = b.id
      LEFT JOIN batches bt ON d.batch_id = bt.id
      WHERE d.user_id = $1
      ORDER BY d.uploaded_at DESC
    `, [userId]);
    return result.rows;
  },

  countByBranchBatchSem: async (branchId, batchId, sem) => {
    const result = await query(`
      SELECT COUNT(*) as count FROM documents
      WHERE branch_id = $1 AND batch_id = $2 AND sem = $3
    `, [branchId, batchId, sem]);
    return result.rows[0];
  }
};

export const UploadJob = {
  create: async (userId, filePath) => {
    const result = await query(`
      INSERT INTO upload_jobs (user_id, file_path, status)
      VALUES ($1, $2, 'pending')
      RETURNING *
    `, [userId, filePath]);
    return result.rows[0];
  },

  updateStatus: async (jobId, status, message = null) => {
    await query(`
      UPDATE upload_jobs 
      SET status = $1, result_message = $2, completed_at = CURRENT_TIMESTAMP
      WHERE id = $3
    `, [status, message, jobId]);
  },

  findById: async (jobId) => {
    const result = await query('SELECT * FROM upload_jobs WHERE id = $1', [jobId]);
    return result.rows[0] || null;
  },

  findByUser: async (userId, limit = 10) => {
    const result = await query(`
      SELECT * FROM upload_jobs 
      WHERE user_id = $1 
      ORDER BY created_at DESC 
      LIMIT $2
    `, [userId, limit]);
    return result.rows;
  },

  getPending: async () => {
    const result = await query(`
      SELECT * FROM upload_jobs 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT 10
    `);
    return result.rows;
  }
};
