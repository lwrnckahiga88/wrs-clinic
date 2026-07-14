import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT a.*, p.full_name as patient_name
    FROM appointments a LEFT JOIN patients p ON p.id = a.patient_id
    ORDER BY a.date, a.time
  `).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { patientId, doctor, clinic, date, time } = req.body;
  const stmt = db.prepare(`
    INSERT INTO appointments (patient_id, doctor, clinic, date, time, status)
    VALUES (?, ?, ?, ?, ?, 'waiting')
  `);
  const result = stmt.run(patientId, doctor, clinic, date, time);
  res.status(201).json({ id: result.lastInsertRowid });
});

router.patch('/:id/status', (req, res) => {
  const { status } = req.body;
  db.prepare('UPDATE appointments SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ ok: true });
});

export default router;
