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
      <h1 className="text-lg font-semibold text-wrs-dark">Consultation</h1>

      <form onSubmit={save} className="bg-white rounded-xl shadow p-4 space-y-4">
        <select
          className="w-full border rounded-lg p-3"
          value={form.patientId}
          onChange={(e) => setForm({ ...form, patientId: e.target.value })}
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>{p.fullName} — Age {p.age}</option>
          ))}
        </select>

        {patient && (
          <div className="text-sm text-gray-500 -mt-2">
            {patient.fullName} · Age {patient.age} · {patient.sex}
          </div>
        )}

        <div>
          <label className="text-xs text-gray-500">Chief Complaint</label>
          <input className="w-full border rounded-lg p-3 mt-1" placeholder="Fever"
            value={form.complaint} onChange={(e) => setForm({ ...form, complaint: e.target.value })} />
        </div>

        <div>
          <label className="text-xs text-gray-500">Diagnosis</label>
          <input className="w-full border rounded-lg p-3 mt-1" placeholder="Malaria"
            value={form.diagnosis} onChange={(e) => setForm({ ...form, diagnosis: e.target.value })} />
        </div>

        <div>
          <label className="text-xs text-gray-500">Prescription</label>
          <input className="w-full border rounded-lg p-3 mt-1" placeholder="ACT"
            value={form.prescription} onChange={(e) => setForm({ ...form, prescription: e.target.value })} />
        </div>

        <button className="w-full bg-wrs-teal text-white rounded-lg py-3 font-semibold">Save Consultation</button>
        {saved && <p className="text-green-600 text-sm text-center">Saved ✓</p>}
      </form>
    </div>
  );
}
