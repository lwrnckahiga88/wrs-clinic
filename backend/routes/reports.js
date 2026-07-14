import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/daily', (req, res) => {
  const patientsToday = db.prepare(`
    SELECT COUNT(DISTINCT patient_id) as count FROM consultations WHERE date(created_at) = date('now')
  `).get().count;

  const revenue = patientsToday * 500; // placeholder until Billing runtime is installed

  const topDiagnosis = db.prepare(`
    SELECT diagnosis, COUNT(*) as count FROM consultations
    WHERE date(created_at) = date('now') AND diagnosis IS NOT NULL
    GROUP BY diagnosis ORDER BY count DESC LIMIT 1
  `).get();

  const lowStock = db.prepare(`
    SELECT name FROM medicines WHERE quantity <= low_stock_threshold
  `).all();

  res.json({
    patientsToday,
    revenue,
    topDiagnosis: topDiagnosis?.diagnosis || '—',
    lowStock: lowStock.map((m) => m.name)
  });
});

export default router;
