const SUPABASE_URL  = 'https://paobqmszupplcntlhgjq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhb2JxbXN6dXBwbGNudGxoZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDAyMTMsImV4cCI6MjA5NDc3NjIxM30.NZ9usG2LFIktFpSBeRR0JuP3KRVMcDVhl39x4uXkpEg';

let _client = null;
let _user   = 'guest';

function getClient() {
  if (!_client && typeof window !== 'undefined' && window.supabase) {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _client;
}

/** Prefix every storage key with the active username. */
function k(key) {
  return `${_user}_${key}`;
}

/** Set the active user — must be called before any DB operation. */
export function setUser(username) {
  _user = username.toLowerCase();
}

export function getUser() {
  return _user;
}

/** Fire-and-forget upsert to Supabase. Never blocks the UI. */
function pushToCloud(fullKey, val) {
  const client = getClient();
  if (!client) return;
  client
    .from('kv_store')
    .upsert({ id: fullKey, value: val }, { onConflict: 'id' })
    .then(({ error }) => {
      if (error) console.warn('[DB] Supabase sync error for', fullKey, '—', error.message);
    });
}

/**
 * Pull this user's keys from Supabase into localStorage.
 * Called once on app startup — keeps data in sync across devices.
 */
export async function syncFromCloud() {
  const client = getClient();
  if (!client) { console.warn('[DB] Supabase client not ready'); return; }
  try {
    const prefix = `${_user}_`;
    const { data, error } = await client
      .from('kv_store')
      .select('id, value')
      .like('id', `${prefix}%`);

    if (error) { console.warn('[DB] Cloud pull failed:', error.message); return; }

    if (data && data.length > 0) {
      for (const row of data) {
        localStorage.setItem(row.id, JSON.stringify(row.value));
      }
      console.log(`[DB:${_user}] Pulled ${data.length} key(s) from Supabase ✓`);
    } else {
      console.log(`[DB:${_user}] No cloud data yet — will push on first write`);
    }
  } catch (e) {
    console.warn('[DB] Cloud sync error:', e);
  }
}

/**
 * Fetch specific keys from Supabase directly (bypasses localStorage prefix).
 * Used by the leaderboard to read all users' data in one shot.
 */
export async function fetchSnapshot(keys) {
  const client = getClient();
  if (!client) return {};
  try {
    const { data, error } = await client
      .from('kv_store')
      .select('id, value')
      .in('id', keys);
    if (error) { console.warn('[DB] fetchSnapshot error:', error.message); return {}; }
    const result = {};
    for (const row of (data || [])) result[row.id] = row.value;
    return result;
  } catch (e) {
    console.warn('[DB] fetchSnapshot exception:', e);
    return {};
  }
}

export const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(k(key))); }
    catch { return null; }
  },
  set(key, val) {
    localStorage.setItem(k(key), JSON.stringify(val));
    pushToCloud(k(key), val);
  },
  update(key, fn) {
    DB.set(key, fn(DB.get(key)));
  }
};
