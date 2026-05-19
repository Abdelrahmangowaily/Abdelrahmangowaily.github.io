import { DB, syncFromCloud } from './db.js';
import { SEED_DATA } from './data.js';
import { today } from './utils.js';
import { render as renderDashboard } from './views/dashboard.js';
import { render as renderProgram } from './views/program.js';
import { render as renderWorkout } from './views/workout.js';
import { render as renderCalendar } from './views/calendar.js';
import { render as renderNutrition } from './views/nutrition.js';
import { render as renderProgress } from './views/progress.js';

const routes = {
  '#dashboard': renderDashboard,
  '#program': renderProgram,
  '#workout': renderWorkout,
  '#calendar': renderCalendar,
  '#nutrition': renderNutrition,
  '#progress': renderProgress
};

export function navigate(hash) {
  window.location.hash = hash;
}

function getHash() {
  return window.location.hash || '#dashboard';
}

function handleRoute() {
  const hash = getHash();
  const view = document.getElementById('view');
  if (!view) return;

  const renderFn = routes[hash] || renderDashboard;
  view.innerHTML = '';
  renderFn(view);

  // Update active nav link
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === hash);
  });
}

function initDB() {
  const initialized = DB.get('wt_initialized');
  if (!initialized) {
    const settings = { ...SEED_DATA.settings, startDate: today() };
    DB.set('wt_settings', settings);
    DB.set('wt_weekSchedule', SEED_DATA.weekSchedule);
    DB.set('wt_gymDays', SEED_DATA.gymDays);
    DB.set('wt_mealPlan', SEED_DATA.mealPlan);
    DB.set('wt_workoutLog', {});
    DB.set('wt_foodLog', {});
    DB.set('wt_initialized', true);
  }
}

window.addEventListener('hashchange', handleRoute);

document.addEventListener('DOMContentLoaded', async () => {
  // Pull latest data from Supabase first, then seed if needed, then render
  await syncFromCloud();
  initDB();

  if (!window.location.hash) {
    window.location.hash = '#dashboard';
  } else {
    handleRoute();
  }
});
