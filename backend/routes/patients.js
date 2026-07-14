import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM patients ORDER BY created_at DESC').all();
  res.json(rows);
});

router.post('/', (req, res) => {
  const { fullName, phone, age, sex, dob, nextOfKin, address, insurance, nationalId, bloodGroup, allergies } = req.body;
  const patientNumber = `P${Date.now().toString().slice(-6)}`;

  const stmt = db.prepare(`
    INSERT INTO patients (patient_number, full_name, phone, age, sex, dob, next_of_kin, address, insurance, national_id, blood_group, allergies)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(patientNumber, fullName, phone, age, sex, dob, nextOfKin, address, insurance, nationalId, bloodGroup, allergies);

  res.status(201).json({ id: result.lastInsertRowid, patientNumber });
});

export default router;
