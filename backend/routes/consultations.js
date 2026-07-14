import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT c.*, p.full_name as patient_name
    FROM consultations c LEFT JOIN patients p ON p.id = c.patient_id
    ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { patientId, appointmentId, chiefComplaint, history, examination, diagnosis, plan, prescription } = req.body;
  const stmt = db.prepare(`
    INSERT INTO consultations (patient_id, appointment_id, chief_complaint, history, examination, diagnosis, plan, prescription)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(patientId, appointmentId, chiefComplaint, history, examination, diagnosis, plan, prescription);
  res.status(201).json({ id: result.lastInsertRowid });
});

export default router;
