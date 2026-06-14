-- IsoTube cloud-sync state store (Cloudflare D1)
-- One row per sync key; the whole AppState is stored as a JSON string.
CREATE TABLE IF NOT EXISTS isotube_state (
  sync_key   TEXT PRIMARY KEY,
  state      TEXT NOT NULL,      -- JSON-serialized AppState
  updated_at INTEGER NOT NULL    -- epoch millis (matches client lastSyncedAt: number)
);
