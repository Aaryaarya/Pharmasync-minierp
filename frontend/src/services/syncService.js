const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000";
const SYNC_PUSH = `${API_BASE}/sync/push`;
const SYNC_PULL = `${API_BASE}/sync/pull`;
const SYNC_STATUS = `${API_BASE}/sync/status`;

const SYNC_INTERVAL_MS = 45_000;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 60_000;

let backoffMs = INITIAL_BACKOFF_MS;
let syncing = false;
let statusListeners = new Set();
let stopLoop = false;

let currentStatus = {
  phase: "idle",
  online: typeof navigator !== "undefined" ? navigator.onLine : true,
  pendingOutbox: 0,
  lastPullAt: null,
  lastError: null,
  remoteReachable: true,
};

export function onSyncStatus(listener) {
  statusListeners.add(listener);
  return () => statusListeners.delete(listener);
}

function emitStatus(patch) {
  currentStatus = { ...currentStatus, ...patch };
  statusListeners.forEach((fn) => fn(currentStatus));
}

export function getSyncStatus() {
  return currentStatus;
}

async function fetchStatus() {
  try {
    const res = await fetch(SYNC_STATUS);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function runSync() {
  if (syncing) return currentStatus;

  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const st = await fetchStatus();
    emitStatus({
      phase: "offline",
      online: false,
      pendingOutbox: st?.pendingOutbox ?? 0,
      lastPullAt: st?.lastPullAt ?? null,
    });
    return currentStatus;
  }

  syncing = true;
  emitStatus({ phase: "syncing", online: true, lastError: null });

  try {
    const pushRes = await fetch(SYNC_PUSH, { method: "POST", headers: { "Content-Type": "application/json" } });
    const pushData = await pushRes.json().catch(() => ({}));

    if (!pushRes.ok) {
      if (pushRes.status === 503) {
        emitStatus({
          phase: "queued",
          remoteReachable: false,
          pendingOutbox: pushData.remaining ?? 0,
          lastError: pushData.error || "Remote offline",
        });
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        return currentStatus;
      }
      throw new Error(pushData.error || "Push failed");
    }

    const since = localStorage.getItem("pharmasync_last_pull") || "1970-01-01T00:00:00.000Z";
    const pullRes = await fetch(`${SYNC_PULL}?since=${encodeURIComponent(since)}`);
    const pullData = await pullRes.json().catch(() => ({}));

    if (!pullRes.ok) {
      if (pullRes.status === 503) {
        emitStatus({
          phase: "queued",
          remoteReachable: false,
          pendingOutbox: pushData.remaining ?? 0,
          lastError: pullData.error || "Remote offline",
        });
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
        return currentStatus;
      }
      throw new Error(pullData.error || "Pull failed");
    }

    if (pullData.serverTime) {
      localStorage.setItem("pharmasync_last_pull", pullData.serverTime);
    }

    backoffMs = INITIAL_BACKOFF_MS;
    const st = await fetchStatus();
    emitStatus({
      phase: "idle",
      remoteReachable: true,
      pendingOutbox: st?.pendingOutbox ?? pushData.remaining ?? 0,
      lastPullAt: pullData.serverTime || st?.lastPullAt || null,
      lastError: null,
    });

    window.dispatchEvent(new CustomEvent("pharmasync:synced", { detail: { push: pushData, pull: pullData } }));
    return currentStatus;
  } catch (err) {
    emitStatus({ phase: "error", lastError: err.message || "Sync failed" });
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
    const st = await fetchStatus();
    if (st) emitStatus({ pendingOutbox: st.pendingOutbox, lastPullAt: st.lastPullAt });
    return currentStatus;
  } finally {
    syncing = false;
  }
}

function scheduleNext() {
  if (stopLoop) return;
  const delay = Math.max(SYNC_INTERVAL_MS, backoffMs);
  window.setTimeout(async () => {
    await runSync();
    scheduleNext();
  }, delay);
}

export function startAutoSync() {
  stopLoop = false;
  scheduleNext();

  const onOnline = () => {
    backoffMs = INITIAL_BACKOFF_MS;
    emitStatus({ online: true });
    runSync();
  };
  const onOffline = () => emitStatus({ online: false, phase: "offline" });

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);

  return () => {
    stopLoop = true;
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
