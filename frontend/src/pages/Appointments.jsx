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
      <h1 className="text-lg font-semibold text-wrs-dark">Today's Appointments</h1>

      <div className="space-y-2">
        {appts.map((a) => (
          <div key={a.id} className="bg-white rounded-lg shadow-sm p-3 flex justify-between items-center">
            <div>
              <span className="font-medium">{a.time}</span> — {patientName(a.patientId)}
            </div>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100">{a.status}</span>
          </div>
        ))}
        {appts.length === 0 && <p className="text-gray-400 text-sm">No appointments yet.</p>}
      </div>

      <form onSubmit={book} className="bg-white rounded-xl shadow p-4 space-y-3">
        <select
          className="w-full border rounded-lg p-3"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName}</option>
          ))}
        </select>
        <input type="date" className="w-full border rounded-lg p-3" value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })} />
        <input type="time" className="w-full border rounded-lg p-3" value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })} />
        <button className="w-full bg-wrs-teal text-white rounded-lg py-3 font-semibold">+ New Appointment</button>
      </form>
    </div>
  );
}
