import { Router } from 'express';
import { db } from '../db/index.js';

const router = Router();

const WELCOME = `Welcome to Riverside Clinic.

1. Book appointment
2. Follow-up
3. Laboratory
4. Emergency

Reply with a number.`;

const MENU_REPLIES = {
  '1': 'Great — please reply with your full name and preferred date/time and we will confirm your appointment.',
  '2': 'Please reply with your patient number and the reason for your follow-up.',
  '3': 'Please reply with the test you need and your patient number.',
  '4': '🚨 If this is a medical emergency, please call the clinic directly or go to the nearest hospital immediately.'
};

function logMessage(phone, direction, body) {
  db.prepare('INSERT INTO messages (phone, direction, body) VALUES (?, ?, ?)').run(phone, direction, body);
}

// Generic webhook — works for either a WhatsApp Business API provider (e.g. Twilio,
// Meta Cloud API) or a Telegram bot forwarding updates here. Normalize whichever
// payload shape arrives into { phone, text }.
router.post('/webhook', (req, res) => {
  const { phone, text } = normalizeInbound(req.body);
  if (!phone || !text) return res.status(400).json({ error: 'Could not parse inbound message' });

  logMessage(phone, 'in', text);

  const trimmed = text.trim();
  const reply = /^hello|hi|start$/i.test(trimmed) ? WELCOME : (MENU_REPLIES[trimmed] || WELCOME);

  logMessage(phone, 'out', reply);

  // In production this calls the WhatsApp/Telegram send API. For the MVP we
  // just persist the reply — the frontend's Messages runtime polls /inbox.
  res.json({ ok: true, reply });
});

router.get('/inbox', (req, res) => {
  const rows = db.prepare(`
    SELECT id, phone, direction, body, created_at as createdAt
    FROM messages ORDER BY created_at DESC LIMIT 50
  `).all();
  res.json(rows);
});

function normalizeInbound(body) {
  // Telegram update shape
  if (body.message?.chat?.id) {
    return { phone: String(body.message.chat.id), text: body.message.text };
  }
  // Generic { phone, text } shape (Twilio/Meta can be mapped to this upstream)
  return { phone: body.phone, text: body.text || body.Body };
}

export default router;
