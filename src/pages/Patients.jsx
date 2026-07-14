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
      <div>
        <div className="eyebrow">wrs.patient.registration</div>
        <h1 className="text-xl mt-1">Patient Registration</h1>
      </div>

      <form onSubmit={save} className="card p-4 space-y-3">
        <input
          className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40 focus:bg-white"
          placeholder="Patient Name"
          value={form.fullName}
          onChange={(e) => setForm({ ...form, fullName: e.target.value })}
        />
        <input
          className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40 focus:bg-white"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40 focus:bg-white"
          placeholder="Age"
          type="number"
          value={form.age}
          onChange={(e) => setForm({ ...form, age: e.target.value })}
        />
        <div className="flex gap-4">
          {['Male', 'Female'].map((s) => (
            <label key={s} className="flex items-center gap-2 text-sm">
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
        <button className="w-full bg-ink text-paper rounded-full py-3 font-semibold">SAVE</button>
      </form>

      <div className="space-y-2">
        {patients.map((p) => (
          <div key={p.id} className="card p-3 flex justify-between items-center">
            <div>
              <div className="font-medium">{p.fullName}</div>
              <div className="text-xs text-ink-soft font-mono">{p.patientNumber} · {p.phone}</div>
            </div>
            <span className="tag-mono bg-paper-dim text-ink-soft">
              {p.synced ? 'synced' : 'pending'}
            </span>
          </div>
        ))}
        {patients.length === 0 && <p className="text-ink-soft text-sm">No patients registered yet.</p>}
      </div>
    </div>
  );
}
