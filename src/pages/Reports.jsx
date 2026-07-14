import { useEffect, useState } from 'react';
import { db } from '../db';

export default function Reports() {
  const [stats, setStats] = useState({ patientsToday: 0, revenue: 0, topDiagnosis: '—', lowStock: [] });

  useEffect(() => {
    (async () => {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const consultations = await db.consultations.where('createdAt').above(todayStart.toISOString()).toArray();
      const patientsToday = new Set(consultations.map((c) => c.patientId)).size;

      const diagnosisCounts = {};
      consultations.forEach((c) => {
        if (!c.diagnosis) return;
        diagnosisCounts[c.diagnosis] = (diagnosisCounts[c.diagnosis] || 0) + 1;
      });
      const topDiagnosis = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

      const medicines = await db.medicines.toArray();
      const lowStock = medicines.filter((m) => m.quantity <= m.lowStockThreshold).map((m) => m.name);

      // Revenue placeholder: KES 500 per consultation until Billing runtime is installed.
      const revenue = consultations.length * 500;

      setStats({ patientsToday, revenue, topDiagnosis, lowStock });
    })();
  }, []);

  const exportPdf = () => window.print();

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="eyebrow">wrs.reports</div>
        <h1 className="text-xl mt-1">Today's Report</h1>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-serif font-semibold text-teal-deep">{stats.patientsToday}</div>
          <div className="text-xs text-ink-soft font-mono uppercase tracking-wide mt-1">Today's Patients</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-serif font-semibold text-teal-deep">KES {stats.revenue.toLocaleString()}</div>
          <div className="text-xs text-ink-soft font-mono uppercase tracking-wide mt-1">Revenue</div>
        </div>
        <div className="card p-4 col-span-2">
          <div className="text-lg font-serif font-semibold">{stats.topDiagnosis}</div>
          <div className="text-xs text-ink-soft font-mono uppercase tracking-wide mt-1">Top Diagnosis</div>
        </div>
        <div className="card p-4 col-span-2">
          <div className="text-xs text-ink-soft font-mono uppercase tracking-wide mb-2">Stock Alerts</div>
          {stats.lowStock.length === 0 && <div className="text-sm text-signal">All stock healthy</div>}
          {stats.lowStock.map((name) => (
            <div key={name} className="text-sm text-amber">{name} — low</div>
          ))}
        </div>
      </div>

      <button onClick={exportPdf} className="w-full bg-ink text-paper rounded-full py-3 font-semibold">
        Export PDF
      </button>
    </div>
  );
}
