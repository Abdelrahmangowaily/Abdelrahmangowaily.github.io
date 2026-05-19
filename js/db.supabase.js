/**
 * Supabase DB layer — drop-in replacement for db.js
 *
 * HOW TO ACTIVATE:
 *  1. Paste your Supabase project URL and anon key below.
 *  2. In index.html, change:
 *       <script type="module" src="js/app.js"></script>
 *     to:
 *       <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
 *       <script type="module" src="js/app.supabase.js"></script>
 *  3. In app.supabase.js (copy of app.js), change:
 *       import { DB } from './db.js';
 *     to:
 *       import { DB } from './db.supabase.js';
 *  4. Run the SQL in supabase-setup.sql in your Supabase SQL editor.
 *
 * The DB object below has the exact same interface as db.js so the
 * rest of the app works without any other changes.
 */

const SUPABASE_URL  = 'YOUR_SUPABASE_URL';   // e.g. https://xyzxyz.supabase.co
const SUPABASE_ANON = 'YOUR_ANON_KEY';       // starts with "eyJ..."

// supabase global is injected by the CDN script in index.html
const _client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);

/**
 * The app stores everything in a single "kv_store" table:
 *   id TEXT PRIMARY KEY,
 *   value JSONB NOT NULL
 *
 * This mirrors localStorage exactly: each wt_* key is one row.
 * For a user with a few hundred workout logs this is fine.
 * Migrate to separate tables later when you need server-side queries.
 */
export const DB = {
  /** Read a key. Returns null if missing. */
  async get(key) {
    const { data, error } = await _client
      .from('kv_store')
      .select('value')
      .eq('id', key)
      .single();
    if (error || !data) return null;
    return data.value;
  },

  /** Write a key (upsert). */
  async set(key, val) {
    const { error } = await _client
      .from('kv_store')
      .upsert({ id: key, value: val }, { onConflict: 'id' });
    if (error) console.error('DB.set error', error);
  },

  /** Read-modify-write. fn receives current value, returns new value. */
  async update(key, fn) {
    const current = await DB.get(key);
    const next = fn(current);
    await DB.set(key, next);
    return next;
  }
};

/**
 * NOTE: The views currently call DB.get/set synchronously (they were
 * written for localStorage). After switching to Supabase you will need
 * to make every render function async and await DB calls.
 *
 * Quick migration pattern:
 *
 *   // Before (localStorage)
 *   const gymDays = DB.get('wt_gymDays') || [];
 *
 *   // After (Supabase)
 *   const gymDays = await DB.get('wt_gymDays') || [];
 *
 * And the render function becomes:
 *   export async function render(container) { ... }
 *
 * In app.js, call it as: await renderDashboard(view);
 */
