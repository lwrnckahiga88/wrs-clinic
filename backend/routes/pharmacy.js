import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

router.get('/medicines', (req, res) => {
  res.json(db.prepare('SELECT * FROM medicines ORDER BY name').all());
});

router.post('/dispense', (req, res) => {
  const { consultationId, medicineId, quantity } = req.body;
  const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medicineId);

  if (!medicine || medicine.quantity < quantity) {
    return res.status(400).json({ error: 'Insufficient stock' });
  }

  db.prepare('UPDATE medicines SET quantity = quantity - ? WHERE id = ?').run(quantity, medicineId);
  const result = db.prepare(`
    INSERT INTO dispenses (consultation_id, medicine_id, quantity) VALUES (?, ?, ?)
  `).run(consultationId, medicineId, quantity);

  const updated = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medicineId);
  if (updated.quantity <= updated.low_stock_threshold) {
    // event: stock.low — in a full deployment this fires a WRS Gateway event
    // that the Reports and Marketplace runtimes subscribe to.
  }

  res.status(201).json({ id: result.lastInsertRowid, remaining: updated.quantity });
});

export default router;
