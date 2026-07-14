import { useEffect, useState } from 'react';
import { db, queueForSync } from '../db';

export default function Appointments() {
  const [appts, setAppts] = useState([]);
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patientId: '', date: '', time: '' });

  const load = async () => {
    setPatients(await db.patients.toArray());
    setAppts(await db.appointments.orderBy('date').toArray());
  };

  useEffect(() => {
    load();
  }, []);

  const book = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.time) return;
    const record = { ...form, patientId: Number(form.patientId), status: 'waiting', synced: false };
    const id = await db.appointments.add(record);
    await queueForSync('appointments', id, 'create', { id, ...record });
    setForm({ patientId: '', date: '', time: '' });
    load();
  };

  const patientName = (id) => patients.find((p) => p.id === id)?.fullName ?? 'Unknown';

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="eyebrow">wrs.appointments</div>
        <h1 className="text-xl mt-1">Today's Appointments</h1>
      </div>

      <div className="space-y-2">
        {appts.map((a) => (
          <div key={a.id} className="card p-3 flex justify-between items-center">
            <div>
              <span className="font-medium">{a.time}</span>
              <span className="text-ink-soft"> — {patientName(a.patientId)}</span>
            </div>
            <span className="tag-mono bg-paper-dim text-ink-soft">{a.status}</span>
          </div>
        ))}
        {appts.length === 0 && <p className="text-ink-soft text-sm">No appointments yet.</p>}
      </div>

      <form onSubmit={book} className="card p-4 space-y-3">
        <select
          className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        <input type="date" className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40" value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input type="time" className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40" value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })} />
        <button className="w-full bg-ink text-paper rounded-full py-3 font-semibold">+ New Appointment</button>
      </form>
    </div>
  );
}
