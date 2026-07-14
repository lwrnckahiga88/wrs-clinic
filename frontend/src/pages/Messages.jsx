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
      <h1 className="text-lg font-semibold text-wrs-dark">WhatsApp Reception</h1>
      <p className="text-sm text-gray-500">
        Patients message the clinic's WhatsApp number. New appointment requests appear here for you to accept.
      </p>
      <div className="space-y-2">
        {messages.map((m) => (
          <div key={m.id} className="bg-white rounded-lg shadow-sm p-3">
            <div className="flex justify-between text-xs text-gray-400">
              <span>{m.phone}</span>
              <span>{new Date(m.createdAt).toLocaleTimeString()}</span>
            </div>
            <div className="mt-1">{m.body}</div>
          </div>
        ))}
        {messages.length === 0 && <p className="text-gray-400 text-sm">No messages yet.</p>}
      </div>
    </div>
  );
}
