// Venues with weak/no WiFi are a real problem for a door scanner — this
// queues a scan locally when the network is unreachable, instead of just
// failing it, and replays the queue once the connection comes back.
// Regular localStorage (not the claude.ai artifact sandbox) — this is a
// real deployed app, so browser storage works completely normally here.

const KEY = 'presence_offline_scan_queue';

function readAll() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeAll(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage full/unavailable — degrade to "just don't queue" */
  }
}

export function enqueueScan({ eventId, token }) {
  const items = readAll();
  items.push({ id: crypto.randomUUID(), eventId, token, queuedAt: new Date().toISOString() });
  writeAll(items);
  return items.length;
}

export function listQueuedScans(eventId) {
  return readAll().filter((i) => !eventId || i.eventId === eventId);
}

export function removeQueuedScan(id) {
  writeAll(readAll().filter((i) => i.id !== id));
}

export function queueCount(eventId) {
  return listQueuedScans(eventId).length;
}
