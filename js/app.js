import { DB, setUser, getUser, syncFromCloud } from './db.js';
import { SEED_DATA, EMPTY_SEED_DATA } from './data.js';
import { today } from './utils.js';
import { render as renderDashboard } from './views/dashboard.js';
import { render as renderProgram   } from './views/program.js';
import { render as renderWorkout   } from './views/workout.js';
import { render as renderCalendar  } from './views/calendar.js';
import { render as renderNutrition } from './views/nutrition.js';
import { render as renderProgress  } from './views/progress.js';

// ── User colours (must match index.html) ────────────────────────────────────
const USER_META = {
  boudy:   { color: '#0ab8d4', initials: 'B'  },
  hamza:   { color: '#e05040', initials: 'H'  },
  youssef: { color: '#8b5cf6', initials: 'Y'  },
  boba:    { color: '#1a9060', initials: 'Bo' },
  xeina:   { color: '#c89010', initials: 'X'  },
};

const routes = {
  '#dashboard': renderDashboard,
  '#program':   renderProgram,
  '#workout':   renderWorkout,
  '#calendar':  renderCalendar,
  '#nutrition': renderNutrition,
  '#progress':  renderProgress,
};

export function navigate(hash) {
  window.location.hash = hash;
}

function getHash() {
  return window.location.hash || '#dashboard';
}

function handleRoute() {
  const hash   = getHash();
  const view   = document.getElementById('view');
  if (!view) return;

  const renderFn = routes[hash] || renderDashboard;
  view.innerHTML  = '';
  renderFn(view);

  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}

function initDB() {
  if (DB.get('wt_initialized')) return;

  const username = getUser();
  const seed     = username === 'boudy' ? SEED_DATA : EMPTY_SEED_DATA;

  DB.set('wt_settings',     { ...seed.settings, startDate: today() });
  DB.set('wt_weekSchedule', seed.weekSchedule);
  DB.set('wt_gymDays',      seed.gymDays);
  DB.set('wt_mealPlan',     seed.mealPlan);
  DB.set('wt_workoutLog',   {});
  DB.set('wt_foodLog',      {});
  DB.set('wt_initialized',  true);
}

function initUI() {
  const username = getUser();
  const meta     = USER_META[username] || { color: '#0ab8d4', initials: username[0].toUpperCase() };
  const display  = username.charAt(0).toUpperCase() + username.slice(1);

  // Sidebar avatar + name
  const avatarEl = document.getElementById('sidebarAvatar');
  const nameEl   = document.getElementById('sidebarName');

  if (avatarEl) {
    avatarEl.textContent        = meta.initials;
    avatarEl.style.background   = `linear-gradient(135deg, ${meta.color}cc, ${meta.color})`;
    avatarEl.style.color        = '#fff';
  }
  if (nameEl) {
    nameEl.textContent = display;
  }

  // Page title
  document.title = `${display}'s Workout`;
}

window.addEventListener('hashchange', handleRoute);

document.addEventListener('DOMContentLoaded', async () => {
  // Read ?user= from the URL
  const params   = new URLSearchParams(window.location.search);
  const username = (params.get('user') || 'boudy').toLowerCase();

  // Guard: redirect unknown users to landing
  if (!USER_META[username]) {
    window.location.href = 'index.html';
    return;
  }

  setUser(username);
  initUI();

  // Pull this user's data from Supabase, then seed if needed, then render
  await syncFromCloud();
  initDB();

  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  } else {
    handleRoute();
  }
});
