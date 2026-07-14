import { db } from './db';
import { apiUrl } from './config';

// Drains the syncQueue against the WRS Gateway backend. Called on app start,
// on 'online' events, and on a timer. Last-writer-wins for now (matches the
// CRDT/vector-clock model used at the federation layer — this is the
// single-device simplification of it).
export async function runSync() {
  if (!navigator.onLine) return { synced: 0, skipped: 'offline' };

  const pending = await db.syncQueue.toArray();
  let synced = 0;

  for (const item of pending) {
    try {
      const res = await fetch(apiUrl(`/api/sync/${item.entity}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ op: item.op, entityId: item.entityId, payload: item.payload })
      });
      if (res.ok) {
        await db.syncQueue.delete(item.id);
        if (item.entityId) {
          await db[item.entity].update(item.entityId, { synced: true }).catch(() => {});
        }
        synced += 1;
      }
    } catch {
      // Network dropped mid-sync — leave item queued, try again next pass.
      break;
    }
  }

  return { synced, remaining: pending.length - synced };
}

// Actual reachability check against the Gateway — navigator.onLine only
// tells you the radio is up, not that the tunnel/backend is alive.
export async function checkGatewayHealth() {
  if (!navigator.onLine) return false;
  try {
    const res = await fetch(apiUrl('/api/health'), {
      signal: AbortSignal.timeout(4000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function watchConnectivity(onStatusChange) {
  const update = () => onStatusChange(navigator.onLine);
  window.addEventListener('online', () => {
    update();
    runSync();
  });
  window.addEventListener('offline', update);
  update();
}
