import { Marks, Document } from '../models/Marks.js';
import { Student, User } from '../models/User.js';
import { getDb } from '../database/init.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const parseResultText = (text) => {
  const header = {};
  const lineItems = [];

  const usnMatch = text.match(/(?:University Seat Number|USN)\s*[:\s]+([A-Z0-9]+)/i);
  if (usnMatch) header.usn = usnMatch[1].trim();

  const nameMatch = text.match(/Student Name\s*[:\s]+([A-Za-z\s]+?)(?:\n|Semester)/i);
  if (nameMatch) header.name = nameMatch[1].trim();

  const semMatch = text.match(/Sem(?:ester)?\s*[:\s]*(\d+)/i);
  if (semMatch) header.sem = semMatch[1].trim();

  const lines = text.split('\n');
  
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    
    if (parts.length >= 6) {
      const firstPart = parts[0];
      
      const isOldScheme = /^\d{2}[A-Z]/.test(firstPart);
      const isNewScheme = /^[A-Z]{2,5}\d{3}[A-Z]?$/i.test(firstPart);
      
      if (isOldScheme || isNewScheme) {
        const subjectCode = firstPart;
        
        const subjectName = parts.slice(1, -5).join(' ');
        const internal = parts[parts.length - 5];
        const external = parts[parts.length - 4];
        const total = parts[parts.length - 3];
        const result = parts[parts.length - 2];
        const announcedDate = parts[parts.length - 1];
        
        if (/^\d+$/.test(internal) && /^\d+$/.test(external) && /^\d+$/.test(total)) {
          lineItems.push({
            subject_code: subjectCode,
            subject_name: subjectName,
            internal: internal,
            external: external,
            total: total,
            result: result.toUpperCase(),
            announced_date: announcedDate
          });
        }
      }
    }
  }

  return { header, lineItems };
};

const processUpload = async (userId, filePath, student) => {
  const txtPath = filePath.replace('.pdf', '.txt').replace('.PDF', '.txt');

  try {
    await execAsync(`pdftotext -layout -enc UTF-8 -nopgbrk "${filePath}" "${txtPath}"`);
  } catch (err) {
    console.error('pdftotext error:', err);
    throw new Error('Failed to process PDF');
  }

  let textContent = '';
  try {
    textContent = await fs.promises.readFile(txtPath, 'utf-8');
  } catch (err) {
    throw new Error('Failed to read extracted text');
  }

  const { header, lineItems } = parseResultText(textContent);

  console.log('Parsed header:', header);
  console.log('Parsed lineItems count:', lineItems.length);
  console.log('Line items:', JSON.stringify(lineItems, null, 2));

  if (!header.usn || header.usn !== student.usn) {
    fs.unlinkSync(filePath);
    if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
    throw new Error('USN in PDF does not match your account');
  }

  const sem = parseInt(header.sem) || 1;

  let backlogsClearedCount = 0;
  const marksToCreate = [];

  for (const item of lineItems) {
    const existingRecord = Marks.findSubjectByUser(userId, item.subject_code);
    
    if (existingRecord && existingRecord.sem < sem) {
      const newAttempts = (existingRecord.attempts || 1) + 1;
      
      if (item.result === 'P') {
        Marks.updateBacklogCleared(existingRecord.id, {
          internal: item.internal,
          external: item.external,
          total: item.total,
          attempts: newAttempts,
          announced_date: item.announced_date || ''
        });
        backlogsClearedCount++;
      } else {
        Marks.updateAttemptCount(existingRecord.id, newAttempts);
      }
    } else if (!existingRecord || existingRecord.sem === sem) {
      marksToCreate.push({
        user_id: userId,
        name: header.name || student.first_name + ' ' + student.last_name,
        sem,
        batch_id: student.batch_id,
        branch_id: student.branch_id,
        subject_code: item.subject_code,
        subject_name: item.subject_name || '',
        internal: item.internal,
        external: item.external,
        total: item.total,
        result: item.result,
        announced_date: item.announced_date || '',
        attempts: 1,
        original_sem: sem
      });
    }
  }

  if (marksToCreate.length > 0) {
    Marks.createBatch(marksToCreate);
  }

  Document.create({
    user_id: userId,
    sem,
    branch_id: student.branch_id,
    batch_id: student.batch_id,
    file_path: filePath
  });

  if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);

  return {
    marksCount: lineItems.length,
    backlogsCleared: backlogsClearedCount,
    semester: sem
  };
};

export const uploadResult = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileSize = req.file.size;
    if (fileSize > 10 * 1024 * 1024) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    const student = Student.findByUserId(req.user.id);
    if (!student) {
      return res.status(400).json({ error: 'Student profile not found' });
    }

    const filePath = req.file.path;

    try {
      const result = await processUpload(req.user.id, filePath, student);
      
      let message = `Result uploaded successfully. ${result.marksCount} subjects processed.`;
      if (result.backlogsCleared > 0) {
        message += ` ${result.backlogsCleared} backlog(s) cleared and updated in original semester.`;
      }

      res.json({
        message,
        ...result
      });
    } catch (processError) {
      return res.status(400).json({ error: processError.message });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload result' });
  }
};

export const getMyMarks = async (req, res) => {
  try {
    const marks = Marks.findByUser(req.user.id);
    const semesters = Marks.getSemestersByUser(req.user.id);

    const semesterPercentages = {};
    semesters.forEach(s => {
      const semMarks = marks.filter(m => m.sem === s.sem);
      let total = 0;
      semMarks.forEach(m => {
        total += parseInt(m.total) || 0;
      });
      semesterPercentages[s.sem] = semMarks.length > 0 ? (total / semMarks.length).toFixed(2) : 0;
    });

    res.json({
      marks,
      semesters: semesters.map(s => s.sem),
      semesterPercentages
    });
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json({ error: 'Failed to get marks' });
  }
};

export const getMyDocuments = async (req, res) => {
  try {
    const documents = Document.findByUser(req.user.id);
    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Failed to get documents' });
  }
};

export const getUploadStatus = async (req, res) => {
  try {
    const db = getDb();
    const jobs = db.prepare('SELECT * FROM upload_jobs WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
    res.json(jobs);
  } catch (error) {
    console.error('Get upload status error:', error);
    res.status(500).json({ error: 'Failed to get upload status' });
  }
};
