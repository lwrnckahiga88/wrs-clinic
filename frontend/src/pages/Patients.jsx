import { useEffect, useState } from 'react';
import { db, queueForSync } from '../db';

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ fullName: '', phone: '', age: '', sex: 'Male' });

  const load = async () => setPatients(await db.patients.orderBy('createdAt').reverse().toArray());

  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;

    const patientNumber = `P${Date.now().toString().slice(-6)}`;
    const record = { ...form, patientNumber, createdAt: new Date().toISOString(), synced: false };
    const id = await db.patients.add(record);
    await queueForSync('patients', id, 'create', { id, ...record });

    setForm({ fullName: '', phone: '', age: '', sex: 'Male' });
    load();
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold text-wrs-dark">Patient Registration</h1>

      <form onSubmit={save} className="bg-white rounded-xl shadow p-4 space-y-3">
        <input
          className="w-full border rounded-lg p-3"
          placeholder="Patient Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          className="w-full border rounded-lg p-3"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="w-full border rounded-lg p-3"
          placeholder="Age"
          type="number"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <div className="flex gap-4">
          {['Male', 'Female'].map((s) => (
            <label key={s} className="flex items-center gap-2">
              <input
                type="radio"
                name="sex"
                checked={form.sex === s}
                onChange={() => setForm({ ...form, sex: s })}
              />
              {s}
            </label>
          ))}
        </div>
        <button className="w-full bg-wrs-teal text-white rounded-lg py-3 font-semibold">SAVE</button>
      </form>

      <div className="space-y-2">
        {patients.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow-sm p-3 flex justify-between">
            <div>
              <div className="font-medium">{p.fullName}</div>
              <div className="text-xs text-gray-500">{p.patientNumber} · {p.phone}</div>
            </div>
            <span className="text-xs self-center text-gray-400">{p.synced ? 'synced' : 'pending'}</span>
          </div>
        ))}
        {patients.length === 0 && <p className="text-gray-400 text-sm">No patients registered yet.</p>}
      </div>
    </div>
  );
}
