import { useEffect, useState } from 'react';
import { db } from '../db';
import { apiUrl } from '../config';

export default function Messages() {
  const [messages, setMessages] = useState([]);

  const load = async () => setMessages(await db.messages.orderBy('createdAt').reverse().toArray());

  useEffect(() => {
    load();
    // Pull any new inbound WhatsApp messages the backend has received since we last synced.
    fetch(apiUrl('/api/whatsapp/inbox'))
      .then((r) => r.json())
      .then(async (inbound) => {
        for (const m of inbound) {
          await db.messages.put({ ...m, synced: true });
        }
        load();
      })
      .catch(() => {}); // offline — show whatever is stored locally
  }, []);

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="eyebrow">wrs.whatsapp.reception</div>
        <h1 className="text-xl mt-1">WhatsApp Reception</h1>
      </div>
      <p className="text-sm text-ink-soft">
        Patients message the clinic's WhatsApp number. New appointment requests appear here for you to accept.
      </p>
      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="card p-3">
            <div className="flex justify-between text-xs text-ink-soft font-mono">
              <span>{m.phone}</span>
              <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="mt-1">{m.body}</div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-ink-soft text-sm">No messages yet.</p>}
      </div>
    </div>
  );
}
