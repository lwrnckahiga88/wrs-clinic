import { useEffect, useState } from 'react';
import {
  db,
  seedIfEmpty,
  getMedicineStock,
  receiveStock,
  dispenseFEFO,
  getBinCard,
  getExpiringBatches,
  addMedicine
} from '../db';

export default function Pharmacy() {
  const [medicines, setMedicines] = useState([]); // catalog + computed stock + nearest expiry
  const [expiring, setExpiring] = useState([]);
  const [query, setQuery] = useState('');
  const [dispenseQty, setDispenseQty] = useState({});
  const [binCardFor, setBinCardFor] = useState(null); // medicine id currently expanded
  const [binCard, setBinCard] = useState(null);
  const [error, setError] = useState(null);

  const [showReceiveFor, setShowReceiveFor] = useState(null); // medicine id
  const [receiveForm, setReceiveForm] = useState({ batchNumber: '', expiryDate: '', quantity: '', supplier: '', costPrice: '', sellingPrice: '' });

  const [showAddDrug, setShowAddDrug] = useState(false);
  const [newDrug, setNewDrug] = useState({ name: '', unit: 'units', lowStockThreshold: 20 });

  const load = async () => {
    await seedIfEmpty();
    const catalog = await db.medicines.filter((m) => m.active !== false).toArray();
    const withStock = await Promise.all(
      catalog.map(async (m) => {
        const quantity = await getMedicineStock(m.id);
        const batches = await db.stockBatches.where('medicineId').equals(m.id).toArray();
        const withStockBatches = batches.filter((b) => b.quantityRemaining > 0 && b.expiryDate);
        const nearestExpiry = withStockBatches.sort((a, b) => a.expiryDate.localeCompare(b.expiryDate))[0]?.expiryDate ?? null;
        return { ...m, quantity, lowStock: quantity <= m.lowStockThreshold, nearestExpiry };
      })
    );
    setMedicines(withStock.sort((a, b) => a.name.localeCompare(b.name)));
    setExpiring(await getExpiringBatches(90));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDispense = async (med) => {
    setError(null);
    const amount = Number(dispenseQty[med.id] || 0);
    if (amount <= 0) return;
    try {
      await dispenseFEFO({ medicineId: med.id, quantity: amount });
      setDispenseQty({ ...dispenseQty, [med.id]: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReceive = async (e, medicineId) => {
    e.preventDefault();
    setError(null);
    const { batchNumber, expiryDate, quantity, supplier, costPrice, sellingPrice } = receiveForm;
    if (!quantity || Number(quantity) <= 0) {
      setError('Enter a quantity greater than zero.');
      return;
    }
    try {
      await receiveStock({
        medicineId,
        batchNumber,
        expiryDate: expiryDate || null,
        quantity: Number(quantity),
        supplier,
        costPrice: costPrice ? Number(costPrice) : null,
        sellingPrice: sellingPrice ? Number(sellingPrice) : null
      });
      setReceiveForm({ batchNumber: '', expiryDate: '', quantity: '', supplier: '', costPrice: '', sellingPrice: '' });
      setShowReceiveFor(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddDrug = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await addMedicine(newDrug);
      setNewDrug({ name: '', unit: 'units', lowStockThreshold: 20 });
      setShowAddDrug(false);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openBinCard = async (medicineId) => {
    if (binCardFor === medicineId) {
      setBinCardFor(null);
      setBinCard(null);
      return;
    }
    setBinCardFor(medicineId);
    setBinCard(await getBinCard(medicineId));
  };

  const filtered = medicines.filter((m) => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="p-4 space-y-4">
      <div>
        <div className="eyebrow">wrs.pharmacy</div>
        <h1 className="text-xl mt-1">Pharmacy</h1>
      </div>

      {error && (
        <div className="bg-amber/10 border border-amber text-amber text-sm rounded-wrs p-3 font-mono">{error}</div>
      )}

      {expiring.length > 0 && (
        <div className="card p-3 border-amber/60">
          <div className="text-xs text-amber font-mono uppercase tracking-wide mb-2">
            Expiry Watch — next 90 days
          </div>
          <div className="space-y-1">
            {expiring.map((b) => (
              <div key={b.id} className="flex justify-between text-sm">
                <span>{b.medicineName} <span className="text-ink-soft font-mono text-xs">({b.batchNumber})</span></span>
                <span className={`font-mono text-xs ${b.expired ? 'text-red-600 font-semibold' : 'text-amber'}`}>
                  {b.expired ? 'EXPIRED' : b.expiryDate}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        className="w-full border border-rule rounded-lg p-3 bg-paper-dim/40"
        placeholder="Search Medicine"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="space-y-2">
        {filtered.map((m) => (
          <div key={m.id} className="card p-3 space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">{m.name}</span>
                <span className="text-ink-soft text-xs font-mono ml-2">{m.unit}</span>
              </div>
              <span className={`tag-mono ${m.lowStock ? 'bg-amber/20 text-amber' : 'bg-paper-dim text-ink-soft'}`}>
                {m.quantity} in stock
              </span>
            </div>

            {m.nearestExpiry && (
              <div className="text-xs text-ink-soft font-mono">Nearest expiry: {m.nearestExpiry}</div>
            )}

            <div className="flex gap-2">
              <input
                type="number"
                className="border border-rule rounded-lg p-2 w-20 bg-paper-dim/40"
                placeholder="Qty"
                value={dispenseQty[m.id] || ''}
                onChange={(e) => setDispenseQty({ ...dispenseQty, [m.id]: e.target.value })}
              />
              <button onClick={() => handleDispense(m)} className="flex-1 bg-ink text-paper rounded-full py-2 text-sm font-semibold">
                Dispense
              </button>
              <button
                onClick={() => setShowReceiveFor(showReceiveFor === m.id ? null : m.id)}
                className="flex-1 border border-wrs-teal text-wrs-teal rounded-full py-2 text-sm font-semibold"
              >
                Receive
              </button>
            </div>

            <button onClick={() => openBinCard(m.id)} className="text-xs font-mono text-teal-deep underline">
              {binCardFor === m.id ? 'Hide bin card' : 'View bin card'}
            </button>

            {showReceiveFor === m.id && (
              <form onSubmit={(e) => handleReceive(e, m.id)} className="border-t border-rule pt-2 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <input className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Batch number"
                    value={receiveForm.batchNumber} onChange={(e) => setReceiveForm({ ...receiveForm, batchNumber: e.target.value })} />
                  <input type="date" className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Expiry"
                    value={receiveForm.expiryDate} onChange={(e) => setReceiveForm({ ...receiveForm, expiryDate: e.target.value })} />
                  <input type="number" className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Quantity received"
                    value={receiveForm.quantity} onChange={(e) => setReceiveForm({ ...receiveForm, quantity: e.target.value })} />
                  <input className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Supplier"
                    value={receiveForm.supplier} onChange={(e) => setReceiveForm({ ...receiveForm, supplier: e.target.value })} />
                  <input type="number" className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Cost price"
                    value={receiveForm.costPrice} onChange={(e) => setReceiveForm({ ...receiveForm, costPrice: e.target.value })} />
                  <input type="number" className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Selling price"
                    value={receiveForm.sellingPrice} onChange={(e) => setReceiveForm({ ...receiveForm, sellingPrice: e.target.value })} />
                </div>
                <button className="w-full bg-teal-deep text-white rounded-full py-2 text-sm font-semibold">
                  Add to stock
                </button>
              </form>
            )}

            {binCardFor === m.id && binCard && (
              <div className="border-t border-rule pt-2 text-xs font-mono space-y-1">
                <div className="flex justify-between text-ink-soft">
                  <span>Opening: {binCard.openingStock}</span>
                  <span>Closing: {binCard.closingStock}</span>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {binCard.movements.slice().reverse().map((mv) => (
                    <div key={mv.id} className="flex justify-between">
                      <span>{new Date(mv.createdAt).toLocaleString()}</span>
                      <span className={mv.type === 'receipt' ? 'text-signal' : 'text-ink-soft'}>
                        {mv.quantity > 0 ? '+' : ''}{mv.quantity}
                      </span>
                      <span>{mv.balanceAfter}</span>
                    </div>
                  ))}
                  {binCard.movements.length === 0 && <div className="text-ink-soft">No movements recorded yet.</div>}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && <p className="text-ink-soft text-sm">No medicines match.</p>}
      </div>

      <div className="card p-3">
        {!showAddDrug ? (
          <button onClick={() => setShowAddDrug(true)} className="w-full border border-wrs-teal text-wrs-teal rounded-full py-2 text-sm font-semibold">
            + Add New Drug / Supply
          </button>
        ) : (
          <form onSubmit={handleAddDrug} className="space-y-2">
            <input className="w-full border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Drug or supply name"
              value={newDrug.name} onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <input className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Unit (tablets, vials...)"
                value={newDrug.unit} onChange={(e) => setNewDrug({ ...newDrug, unit: e.target.value })} />
              <input type="number" className="border border-rule rounded-lg p-2 text-sm bg-paper-dim/40" placeholder="Low stock threshold"
                value={newDrug.lowStockThreshold} onChange={(e) => setNewDrug({ ...newDrug, lowStockThreshold: e.target.value })} />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="flex-1 bg-ink text-paper rounded-full py-2 text-sm font-semibold">Save</button>
              <button type="button" onClick={() => setShowAddDrug(false)} className="flex-1 bg-paper-dim text-ink-soft rounded-full py-2 text-sm font-semibold">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
