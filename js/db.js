const SUPABASE_URL  = 'https://paobqmszupplcntlhgjq.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhb2JxbXN6dXBwbGNudGxoZ2pxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMDAyMTMsImV4cCI6MjA5NDc3NjIxM30.NZ9usG2LFIktFpSBeRR0JuP3KRVMcDVhl39x4uXkpEg';

let _client = null;

function getClient() {
  if (!_client && typeof window !== 'undefined' && window.supabase) {
    _client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  }
  return _client;
}

function pushToCloud(key, val) {
  const client = getClient();
  if (!client) return;
  client
    .from('kv_store')
    .upsert({ id: key, value: val }, { onConflict: 'id' })
    .then(({ error }) => {
      if (error) console.warn('[DB] Supabase sync error for', key, '—', error.message);
    });
}

/** Pull all keys from Supabase into localStorage. Called once on startup. */
export async function syncFromCloud() {
  const client = getClient();
  if (!client) { console.warn('[DB] Supabase client not ready'); return; }
  try {
    const { data, error } = await client.from('kv_store').select('id, value');
    if (error) { console.warn('[DB] Cloud pull failed:', error.message); return; }
    if (data && data.length > 0) {
      for (const row of data) {
        localStorage.setItem(row.id, JSON.stringify(row.value));
      }
      console.log(`[DB] Pulled ${data.length} key(s) from Supabase ✓`);
    } else {
      console.log('[DB] Supabase is empty — local data will be pushed on first write');
    }
  } catch (e) {
    console.warn('[DB] Cloud sync error:', e);
  }
}

export const DB = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); }
    catch { return null; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
    pushToCloud(key, val);
  },
  update(key, fn) {
    DB.set(key, fn(DB.get(key)));
  }
};
