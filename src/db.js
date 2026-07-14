import Dexie from 'dexie';

// Local-first store on the phone. Every runtime package (patients, appointments,
// consultations, pharmacy, reports) reads and writes here first. Nothing waits
// on the network. A syncQueue table tracks unsynced writes for when Wi-Fi/data
// returns.
export const db = new Dexie('wrs_clinic');

db.version(1).stores({
  patients: '++id, patientNumber, fullName, phone, createdAt, synced',
  appointments: '++id, patientId, date, time, status, synced',
  consultations: '++id, patientId, appointmentId, diagnosis, createdAt, synced',
  medicines: '++id, name, quantity, lowStockThreshold',
  dispenses: '++id, consultationId, medicineId, quantity, createdAt, synced',
  messages: '++id, phone, direction, body, createdAt, synced',
  syncQueue: '++id, entity, entityId, op, payload, createdAt'
});

// v2 — proper bin-card model. `medicines` becomes a catalog (name/unit/
// threshold); actual stock lives in `stockBatches` (one row per received
// lot, each with its own expiry) and `stockMovements` (the bin-card ledger
// itself: one row per receipt/dispense with a running balance). Single
// device is the sole writer here, so this local copy IS the authoritative
// stock — the Gateway backend just mirrors it for durability/reporting.
db.version(2).stores({
  patients: '++id, patientNumber, fullName, phone, createdAt, synced',
  appointments: '++id, patientId, date, time, status, synced',
  consultations: '++id, patientId, appointmentId, diagnosis, createdAt, synced',
  medicines: '++id, name, unit, lowStockThreshold, active, synced',
  stockBatches: '++id, medicineId, batchNumber, expiryDate, quantityRemaining, synced',
  stockMovements: '++id, medicineId, batchId, type, createdAt, synced',
  dispenses: '++id, consultationId, medicineId, batchId, quantity, createdAt, synced',
  messages: '++id, phone, direction, body, createdAt, synced',
  syncQueue: '++id, entity, entityId, op, payload, createdAt'
}).upgrade(async (tx) => {
  // Every medicine that existed under the old flat-quantity shape gets a
  // matching opening batch + receipt movement, so nothing already on a
  // phone silently loses its stock count during this migration.
  const oldMedicines = await tx.table('medicines').toArray();
  for (const med of oldMedicines) {
    const quantity = med.quantity ?? 0;
    await tx.table('medicines').update(med.id, {
      unit: med.unit ?? 'units',
      active: true,
      synced: true
    });
    if (quantity > 0) {
      const batchId = await tx.table('stockBatches').add({
        medicineId: med.id,
        batchNumber: 'LEGACY',
        expiryDate: null,
        quantityReceived: quantity,
        quantityRemaining: quantity,
        supplier: null,
        costPrice: null,
        sellingPrice: null,
        createdAt: new Date().toISOString(),
        synced: true
      });
      await tx.table('stockMovements').add({
        medicineId: med.id,
        batchId,
        type: 'receipt',
        quantity,
        balanceAfter: quantity,
        reference: 'migrated from legacy stock',
        createdAt: new Date().toISOString(),
        synced: true
      });
    }
  }
});

// --- Sync queue helpers -----------------------------------------------

export async function queueForSync(entity, entityId, op, payload) {
  await db.syncQueue.add({
    entity,
    entityId,
    op, // 'create' | 'update' | 'delete'
    payload,
    createdAt: new Date().toISOString()
  });
}

export async function markSynced(entity, id) {
  await db[entity].update(id, { synced: true });
}

// Seed demo medicines + opening stock batches on first run so Pharmacy isn't empty.
export async function seedIfEmpty() {
  const count = await db.medicines.count();
  if (count > 0) return;

  const seedData = [
    { name: 'Paracetamol', unit: 'tablets', lowStockThreshold: 20, batchNumber: 'PCM-2601', expiryDaysFromNow: 540, quantity: 120, costPrice: 2.5, sellingPrice: 5 },
    { name: 'Amoxicillin', unit: 'capsules', lowStockThreshold: 20, batchNumber: 'AMX-2589', expiryDaysFromNow: 45, quantity: 15, costPrice: 8, sellingPrice: 15 },
    { name: 'ACT (Artemether-Lumefantrine)', unit: 'packs', lowStockThreshold: 15, batchNumber: 'ACT-2577', expiryDaysFromNow: 300, quantity: 60, costPrice: 40, sellingPrice: 80 }
  ];

  for (const seed of seedData) {
    const medicineId = await db.medicines.add({
      name: seed.name,
      unit: seed.unit,
      lowStockThreshold: seed.lowStockThreshold,
      active: true,
      synced: false
    });
    await queueForSync('medicines', medicineId, 'create', {
      name: seed.name,
      unit: seed.unit,
      lowStockThreshold: seed.lowStockThreshold
    });

    const expiryDate = new Date(Date.now() + seed.expiryDaysFromNow * 86400000).toISOString().slice(0, 10);
    await receiveStock({
      medicineId,
      batchNumber: seed.batchNumber,
      expiryDate,
      quantity: seed.quantity,
      supplier: 'KEMSA',
      costPrice: seed.costPrice,
      sellingPrice: seed.sellingPrice
    });
  }
}

// --- Pharmacy: bin-card model -------------------------------------------

export async function getMedicineStock(medicineId) {
  const batches = await db.stockBatches.where('medicineId').equals(medicineId).toArray();
  return batches.reduce((sum, b) => sum + b.quantityRemaining, 0);
}

export async function receiveStock({ medicineId, batchNumber, expiryDate, quantity, supplier, costPrice, sellingPrice }) {
  if (!medicineId || !quantity || quantity <= 0) throw new Error('medicineId and a positive quantity are required');

  const createdAt = new Date().toISOString();
  const batchId = await db.stockBatches.add({
    medicineId,
    batchNumber: batchNumber || null,
    expiryDate: expiryDate || null,
    quantityReceived: quantity,
    quantityRemaining: quantity,
    supplier: supplier || null,
    costPrice: costPrice ?? null,
    sellingPrice: sellingPrice ?? null,
    createdAt,
    synced: false
  });

  const balanceAfter = await getMedicineStock(medicineId);
  const movementId = await db.stockMovements.add({
    medicineId,
    batchId,
    type: 'receipt',
    quantity,
    balanceAfter,
    reference: 'stock received',
    createdAt,
    synced: false
  });

  await queueForSync('stockBatches', batchId, 'create', {
    medicineId, batchNumber, expiryDate, quantity, supplier, costPrice, sellingPrice
  });

  return { batchId, movementId, balanceAfter };
}

// First-Expired-First-Out — dispenses from whichever batch expires soonest,
// not whichever was received first. Runs fully offline: this device is the
// sole writer for its own batches, so the local ledger is authoritative.
export async function dispenseFEFO({ medicineId, quantity, consultationId }) {
  if (!medicineId || !quantity || quantity <= 0) throw new Error('medicineId and a positive quantity are required');

  const available = await getMedicineStock(medicineId);
  if (available < quantity) {
    const err = new Error(`Insufficient stock: ${available} available, ${quantity} requested`);
    err.code = 'INSUFFICIENT_STOCK';
    throw err;
  }

  const batches = (await db.stockBatches.where('medicineId').equals(medicineId).toArray())
    .filter((b) => b.quantityRemaining > 0)
    .sort((a, b) => {
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      return a.expiryDate.localeCompare(b.expiryDate);
    });

  let remaining = quantity;
  const dispensedFrom = [];
  const createdAt = new Date().toISOString();

  for (const batch of batches) {
    if (remaining <= 0) break;
    const takeFromBatch = Math.min(batch.quantityRemaining, remaining);

    await db.stockBatches.update(batch.id, { quantityRemaining: batch.quantityRemaining - takeFromBatch, synced: false });

    const balanceAfter = await getMedicineStock(medicineId);
    await db.stockMovements.add({
      medicineId,
      batchId: batch.id,
      type: 'dispense',
      quantity: -takeFromBatch,
      balanceAfter,
      reference: 'dispensed',
      createdAt,
      synced: false
    });

    const dispenseId = await db.dispenses.add({
      consultationId: consultationId ?? null,
      medicineId,
      batchId: batch.id,
      quantity: takeFromBatch,
      createdAt,
      synced: false
    });

    dispensedFrom.push({ batchId: batch.id, quantity: takeFromBatch, dispenseId });
    remaining -= takeFromBatch;
  }

  // One sync entry for the whole dispense — the Gateway independently runs
  // its own FEFO against its batches, so it doesn't need our batch choices,
  // just the total quantity + which medicine/consultation it was for.
  await queueForSync('dispenses', dispensedFrom[0]?.dispenseId, 'create', {
    medicineId, quantity, consultationId
  });

  return { dispensedFrom, balanceAfter: await getMedicineStock(medicineId) };
}

// Full movement history for one medicine with running balance, plus opening
// stock (balance immediately before the range) and closing stock (balance
// at the end of it) — the two numbers a real bin card audit asks for.
export async function getBinCard(medicineId, { from, to } = {}) {
  const all = (await db.stockMovements.where('medicineId').equals(medicineId).toArray())
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const inRange = all.filter((m) => (!from || m.createdAt >= from) && (!to || m.createdAt <= to));
  const before = all.filter((m) => from && m.createdAt < from);

  const openingStock = before.length > 0 ? before[before.length - 1].balanceAfter : 0;
  const closingStock = inRange.length > 0 ? inRange[inRange.length - 1].balanceAfter : openingStock;

  return { openingStock, closingStock, movements: inRange };
}

export async function getExpiringBatches(days = 90) {
  const cutoff = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const medicines = await db.medicines.toArray();
  const nameById = Object.fromEntries(medicines.map((m) => [m.id, m.name]));

  const batches = await db.stockBatches
    .filter((b) => b.quantityRemaining > 0 && !!b.expiryDate && b.expiryDate <= cutoff)
    .toArray();

  return batches
    .map((b) => ({ ...b, medicineName: nameById[b.medicineId] ?? 'Unknown', expired: b.expiryDate < today }))
    .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
}

export async function addMedicine({ name, unit, lowStockThreshold }) {
  if (!name?.trim()) throw new Error('name is required');
  const id = await db.medicines.add({
    name: name.trim(),
    unit: unit || 'units',
    lowStockThreshold: lowStockThreshold ?? 20,
    active: true,
    synced: false
  });
  await queueForSync('medicines', id, 'create', { name: name.trim(), unit, lowStockThreshold });
  return id;
}
