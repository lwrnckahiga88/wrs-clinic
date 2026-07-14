import { useEffect, useState } from 'react';
import { db, queueForSync } from '../db';

export default function Consultation() {
  const [patients, setPatients] = useState([]);
  const [form, setForm] = useState({ patientId: '', complaint: '', diagnosis: '', prescription: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    db.patients.toArray().then(setPatients);
  }, []);

  const save = async (e) => {
    e.preventDefault();
    if (!form.patientId || !form.diagnosis) return;
    const record = {
      patientId: Number(form.patientId),
      complaint: form.complaint,
      diagnosis: form.diagnosis,
      prescription: form.prescription,
      createdAt: new Date().toISOString(),
      synced: false
    };
    const id = await db.consultations.add(record);
    await queueForSync('consultations', id, 'create', { id, ...record });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setForm({ patientId: '', complaint: '', diagnosis: '', prescription: '' });
  };

  const patient = patients.find((p) => p.id === Number(form.patientId));

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="eyebrow">wrs.consultation</div>
        <h1 className="text-xl mt-1">Consultation</h1>
      </div>

      <form onSubmit={save} className="card p-4 space-y-4">
        <select
          className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName} — Age {p.age}</option>
          ))}
        </select>

        {patient && (
          <div className="text-sm text-ink-soft -mt-2 font-mono">
            {patient.fullName} · Age {patient.age} · {patient.sex}
          </div>
        )}

        <div>
          <label className="text-xs text-ink-soft uppercase tracking-wide font-mono">Chief Complaint</label>
          <input className="w-full border border-rule rounded-lg p-3 mt-1 bg-paper-dim/40" placeholder="Fever"
            value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} />
        </div>

        <div>
          <label className="text-xs text-ink-soft uppercase tracking-wide font-mono">Diagnosis</label>
          <input className="w-full border border-rule rounded-lg p-3 mt-1 bg-paper-dim/40" placeholder="Malaria"
            value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
        </div>

        <div>
          <label className="text-xs text-ink-soft uppercase tracking-wide font-mono">Prescription</label>
          <input className="w-full border border-rule rounded-lg p-3 mt-1 bg-paper-dim/40" placeholder="ACT"
            value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} />
        </div>

        <button className="w-full bg-ink text-paper rounded-full py-3 font-semibold">Save Consultation</button>
        {saved && <p className="text-signal text-sm text-center font-mono">Saved ✓</p>}
      </form>
    </div>
  );
}
