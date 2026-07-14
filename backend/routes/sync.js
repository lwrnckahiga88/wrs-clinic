import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

// Maps the Dexie table name -> SQLite table + column mapping.
// Kept intentionally simple (last-writer-wins) for a single-device MVP.
const TABLES = {
  patients: {
    table: 'patients',
    columns: ['patient_number', 'full_name', 'phone', 'age', 'sex']
  },
  appointments: {
    table: 'appointments',
    columns: ['patient_id', 'date', 'time', 'status']
  },
  consultations: {
    table: 'consultations',
    columns: ['patient_id', 'chief_complaint', 'diagnosis', 'prescription']
  },
  dispenses: {
    table: 'dispenses',
    columns: ['medicine_id', 'quantity']
  }
};

router.post('/:entity', (req, res) => {
  const { entity } = req.params;
  const { op, payload } = req.body;
  const mapping = TABLES[entity];

  if (!mapping) return res.status(400).json({ error: `Unknown sync entity: ${entity}` });
  if (op !== 'create') return res.status(400).json({ error: `Unsupported op: ${op}` });

  try {
    const fieldMap = {
      patients: { fullName: 'full_name', patientNumber: 'patient_number' },
      appointments: { patientId: 'patient_id' },
      consultations: { patientId: 'patient_id', complaint: 'chief_complaint' },
      dispenses: { medicineId: 'medicine_id' }
    };
    const map = fieldMap[entity] || {};

    const columns = mapping.columns;
    const values = columns.map((col) => {
      const camelKey = Object.keys(map).find((k) => map[k] === col) || col.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      return payload[camelKey] ?? null;
    });

    const placeholders = columns.map(() => '?').join(', ');
    const stmt = db.prepare(`INSERT INTO ${mapping.table} (${columns.join(', ')}) VALUES (${placeholders})`);
    const result = stmt.run(...values);

    if (entity === 'dispenses' && payload.medicineId && payload.quantity) {
      db.prepare('UPDATE medicines SET quantity = quantity - ? WHERE id = ?').run(payload.quantity, payload.medicineId);
    }

    res.json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
