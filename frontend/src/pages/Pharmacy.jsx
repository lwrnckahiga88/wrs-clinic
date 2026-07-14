import { useEffect, useState } from 'react';
import { db, queueForSync, seedIfEmpty } from '../db';

export default function Pharmacy() {
  const [medicines, setMedicines] = useState([]);
  const [query, setQuery] = useState('');
  const [qty, setQty] = useState({});

  const load = async () => {
    await seedIfEmpty();
    setMedicines(await db.medicines.toArray());
  };

  useEffect(() => {
    load();
  }, []);

  const dispense = async (med) => {
    const amount = Number(qty[med.id] || 0);
    if (amount <= 0 || amount > med.quantity) return;

    const newQty = med.quantity - amount;
    await db.medicines.update(med.id, { quantity: newQty });
    const dispenseRecord = { medicineId: med.id, quantity: amount, createdAt: new Date().toISOString(), synced: false };
    const id = await db.dispenses.add(dispenseRecord);
    await queueForSync('dispenses', id, 'create', { id, ...dispenseRecord });

    setQty({ ...qty, [med.id]: '' });
    load();
  };

  const filtered = medicines.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-lg font-semibold text-wrs-dark">Pharmacy</h1>
      <input
        className="w-full border rounded-lg p-3"
        placeholder="Search Medicine"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="bg-white rounded-lg shadow-sm p-3 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">{m.name}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${m.quantity <= m.lowStockThreshold ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                {m.quantity} in stock
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                className="border rounded-lg p-2 w-24"
                placeholder="Qty"
                value={qty[m.id] || ''}
                onChange={(e) => setQty({ ...qty, [m.id]: e.target.value })}
              />
              <button
                onClick={() => dispense(m)}
                className="flex-1 bg-wrs-teal text-white rounded-lg py-2 font-semibold"
              >
                Dispense
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
