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

// Seed a couple of demo medicines on first run so Pharmacy isn't empty.
export async function seedIfEmpty() {
  const count = await db.medicines.count();
  if (count === 0) {
    await db.medicines.bulkAdd([
      { name: 'Paracetamol', quantity: 120, lowStockThreshold: 20 },
      { name: 'Amoxicillin', quantity: 15, lowStockThreshold: 20 },
      { name: 'ACT (Artemether-Lumefantrine)', quantity: 60, lowStockThreshold: 15 }
    ]);
  }
}
