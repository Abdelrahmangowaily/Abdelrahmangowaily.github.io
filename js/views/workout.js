import { DB } from '../db.js';
import { today, getDayName, showToast, showModal, generateId } from '../utils.js';
import { navigate } from '../app.js';

let activeWorkout = null;

// ── Cardio catalogue ────────────────────────────────────────────────────────
const CARDIO_TYPES = [
  { value: 'running',    label: 'Running',    emoji: '🏃', color: '#f97316' },
  { value: 'padel',      label: 'Padel',      emoji: '🎾', color: '#22c55e' },
  { value: 'basketball', label: 'Basketball', emoji: '🏀', color: '#f59e0b' },
  { value: 'swimming',   label: 'Swimming',   emoji: '🏊', color: '#06b6d4' },
  { value: 'skating',    label: 'Skating',    emoji: '🛼', color: '#3b82f6' },
  { value: 'cycling',    label: 'Cycling',    emoji: '🚴', color: '#8b5cf6' },
  { value: 'football',   label: 'Football',   emoji: '⚽', color: '#84cc16' },
  { value: 'jump_rope',  label: 'Jump Rope',  emoji: '🪢', color: '#ec4899' },
  { value: 'hiking',     label: 'Hiking',     emoji: '🥾', color: '#a16207' },
  { value: 'yoga',       label: 'Yoga',       emoji: '🧘', color: '#10b981' },
];

function getCardio(value) {
  return CARDIO_TYPES.find(c => c.value === value) || null;
}

export function render(container) {
  activeWorkout = null;
  _renderMain(container);
}

function _renderMain(container) {
  const weekSchedule = DB.get('wt_weekSchedule') || {};
  const gymDays      = DB.get('wt_gymDays') || [];
  const todayStr     = today();
  const todayDayName = getDayName(todayStr);

  const dayOptions = gymDays.map(d => `<option value="${d.id}">${d.name} — ${d.subtitle}</option>`).join('');
  const workoutOverrideOptions = `
    <option value="">— Select a gym day —</option>
    ${dayOptions}
    <option value="mobility">Mobility 🧘</option>
  `;

  const weekDays      = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

  function getChipLabel(val) {
    if (!val || val === 'rest') return 'Rest';
    const d = gymDays.find(d => d.id === val);
    if (d) return d.name;
    if (val === 'mobility') return 'Mobility';
    const c = getCardio(val);
    if (c) return c.label;
    return val;
  }

  function getChipEmoji(val) {
    if (!val || val === 'rest') return '';
    const c = getCardio(val);
    if (c) return c.emoji + ' ';
    if (val === 'mobility') return '🧘 ';
    return '';
  }

  function getChipColor(val) {
    if (!val || val === 'rest') return 'var(--bg-elevated)';
    const d = gymDays.find(d => d.id === val);
    if (d) return d.color + '33';
    if (val === 'mobility') return '#10b98122';
    const c = getCardio(val);
    if (c) return c.color + '22';
    return 'var(--bg-elevated)';
  }

  const scheduledDayId = weekSchedule[todayDayName];
  const scheduledDay   = gymDays.find(d => d.id === scheduledDayId);
  const scheduledCardio = getCardio(scheduledDayId);
  const scheduledLabel = scheduledDay   ? scheduledDay.name
    : scheduledCardio  ? `${scheduledCardio.emoji} ${scheduledCardio.label}`
    : scheduledDayId === 'mobility' ? 'Mobility 🧘'
    : 'Rest Day 😴';

  container.innerHTML = `
    <div class="view-header">
      <h1>Workout</h1>
      <p class="text-muted">Plan and log your training</p>
    </div>

    <section class="card section-card">
      <h2 class="section-title">Weekly Schedule</h2>
      <p class="text-muted" style="margin-bottom:1rem">Tap a day to change its assignment</p>
      <div class="week-row" id="week-row">
        ${weekDays.map(day => `
          <div class="week-chip ${day === todayDayName ? 'week-chip-today' : ''}"
               data-day="${day}"
               style="background:${getChipColor(weekSchedule[day])}">
            <span class="week-chip-label">${weekDayLabels[day]}</span>
            <span class="week-chip-value">${getChipEmoji(weekSchedule[day])}${getChipLabel(weekSchedule[day])}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="card section-card">
      <h2 class="section-title">Log Today's Activity</h2>
      <p class="text-muted" style="margin-bottom:1rem">Today is <strong>${todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1)}</strong>. Scheduled: <strong>${scheduledLabel}</strong></p>

      <div class="form-row" style="align-items:flex-end;margin-bottom:1rem">
        <div class="form-group" style="flex:1">
          <label>Start a gym workout</label>
          <select id="workout-override" class="form-input">
            ${workoutOverrideOptions}
          </select>
        </div>
        <button class="btn btn-primary" id="btn-start-workout">Start Workout 💪</button>
      </div>

      <div class="activity-log-row">
        <button class="btn btn-secondary activity-btn" id="btn-log-cardio">
          <span class="activity-btn-icon">🏃</span>
          <span>Log Cardio</span>
        </button>
        <button class="btn btn-secondary activity-btn" id="btn-log-mobility">
          <span class="activity-btn-icon">🧘</span>
          <span>Log Mobility</span>
        </button>
        <button class="btn btn-secondary activity-btn" id="btn-log-rest">
          <span class="activity-btn-icon">😴</span>
          <span>Rest Day</span>
        </button>
      </div>
    </section>

    <div id="active-workout-section"></div>
  `;

  // Week chip click
  container.querySelectorAll('.week-chip').forEach(chip => {
    chip.addEventListener('click', () => changeScheduleDay(container, chip.dataset.day, weekSchedule, gymDays));
  });

  // Start gym workout
  container.querySelector('#btn-start-workout').addEventListener('click', () => {
    const override = container.querySelector('#workout-override').value;
    const dayId    = override || scheduledDayId;
    const day      = gymDays.find(d => d.id === dayId);
    if (!day) { showToast('Please select a gym day to start a workout', 'error'); return; }
    startWorkout(container, day);
  });

  // Log cardio → open picker
  container.querySelector('#btn-log-cardio').addEventListener('click', () => openCardioPicker(container));

  container.querySelector('#btn-log-mobility').addEventListener('click', () => logActivity('mobility', 'Mobility'));
  container.querySelector('#btn-log-rest').addEventListener('click',    () => logActivity('rest',     'Rest Day'));
}

// ── Cardio picker modal ──────────────────────────────────────────────────────
async function openCardioPicker(container) {
  const grid = CARDIO_TYPES.map(c => `
    <button class="cardio-pick-btn" data-value="${c.value}" style="--c:${c.color}">
      <span class="cardio-pick-emoji">${c.emoji}</span>
      <span class="cardio-pick-label">${c.label}</span>
    </button>
  `).join('');

  const idx = await showModal('What cardio did you do?', `
    <div class="cardio-grid">${grid}</div>
    <input type="hidden" id="cardio-selected" value="">
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Log it ✓', type: 'primary' }]);

  if (idx !== 1) return;

  const selected = document.getElementById('cardio-selected')?.value;
  if (!selected) { showToast('Pick a cardio type first', 'error'); return; }

  const c = getCardio(selected);
  logActivity(selected, `${c.emoji} ${c.label}`, 'cardio');
}

// Wire up cardio grid buttons (delegated from modal overlay)
document.addEventListener('click', e => {
  const btn = e.target.closest('.cardio-pick-btn');
  if (!btn) return;
  document.querySelectorAll('.cardio-pick-btn').forEach(b => b.classList.remove('selected'));
  btn.classList.add('selected');
  const hidden = document.getElementById('cardio-selected');
  if (hidden) hidden.value = btn.dataset.value;
});

// ── Schedule change modal ────────────────────────────────────────────────────
async function changeScheduleDay(container, day, weekSchedule, gymDays) {
  const dayLabels = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };
  const current = weekSchedule[day] || '';

  const gymOptions    = gymDays.map(d => `<option value="${d.id}" ${d.id === current ? 'selected' : ''}>${d.name} — ${d.subtitle}</option>`).join('');
  const cardioOptions = CARDIO_TYPES.map(c => `<option value="${c.value}" ${c.value === current ? 'selected' : ''}>${c.emoji} ${c.label}</option>`).join('');

  const formId = 'sched-form';
  const idx = await showModal(`Schedule for ${dayLabels[day]}`, `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Assign Activity</label>
        <select name="assignment" class="form-input">
          <option value="" ${!current ? 'selected' : ''}>😴 Rest / Off</option>
          <optgroup label="Gym Days">${gymOptions}</optgroup>
          <optgroup label="Cardio">${cardioOptions}</optgroup>
          <option value="mobility" ${'mobility' === current ? 'selected' : ''}>🧘 Mobility</option>
        </select>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Save', type: 'primary' }]);

  if (idx !== 1) return;

  const val = document.getElementById(formId).assignment.value;
  DB.update('wt_weekSchedule', sched => { sched[day] = val || null; return sched; });
  showToast('Schedule updated');
  _renderMain(container);
}

// ── Active workout ───────────────────────────────────────────────────────────
function startWorkout(container, day) {
  activeWorkout = { dayId: day.id, startTime: Date.now(), exerciseStates: {} };
  day.exercises.forEach(ex => {
    const numSets = parseInt(ex.sets) || 3;
    activeWorkout.exerciseStates[ex.id] = {
      done: false,
      sets: Array.from({ length: numSets }, () => ({ done: false, reps: '', weight: '' }))
    };
  });
  renderActiveWorkout(container, day);
}

function renderActiveWorkout(container, day) {
  const section = container.querySelector('#active-workout-section');
  section.innerHTML = `
    <section class="card section-card active-workout">
      <div class="active-workout-header">
        <div>
          <h2>${day.name}</h2>
          <p class="text-muted">${day.subtitle}</p>
        </div>
        <span class="badge" style="background:${day.color}22;color:${day.color}">${day.duration}</span>
      </div>
      <div class="warmup-box"><strong>Warm-up:</strong> ${day.warmup}</div>
      <div class="exercise-tracker" id="exercise-tracker">
        ${day.exercises.map(ex => renderExerciseTracker(ex, activeWorkout.exerciseStates[ex.id])).join('')}
      </div>
      <div class="finish-btns">
        <button class="btn btn-primary btn-lg" id="btn-finish-workout">Finish Workout 💪</button>
        <button class="btn btn-secondary" id="btn-cancel-workout">Cancel</button>
      </div>
    </section>
  `;

  section.querySelectorAll('.set-bubble').forEach(bubble => {
    bubble.addEventListener('click', () => {
      const exId   = bubble.dataset.exId;
      const setIdx = parseInt(bubble.dataset.setIdx);
      const state  = activeWorkout.exerciseStates[exId];
      if (!state) return;
      const inputRow = section.querySelector(`.set-input-row[data-ex-id="${exId}"][data-set-idx="${setIdx}"]`);
      if (inputRow) inputRow.classList.toggle('visible');
      state.sets[setIdx].done = !state.sets[setIdx].done;
      bubble.classList.toggle('set-done', state.sets[setIdx].done);
    });
  });

  section.querySelectorAll('.set-reps-input').forEach(input => {
    input.addEventListener('change', () => {
      activeWorkout.exerciseStates[input.dataset.exId].sets[parseInt(input.dataset.setIdx)].reps = input.value;
    });
  });
  section.querySelectorAll('.set-weight-input').forEach(input => {
    input.addEventListener('change', () => {
      activeWorkout.exerciseStates[input.dataset.exId].sets[parseInt(input.dataset.setIdx)].weight = input.value;
    });
  });

  section.querySelectorAll('.exercise-done-check').forEach(cb => {
    cb.addEventListener('change', () => {
      activeWorkout.exerciseStates[cb.dataset.exId].done = cb.checked;
      cb.closest('.exercise-track-card').classList.toggle('exercise-completed', cb.checked);
    });
  });

  section.querySelector('#btn-finish-workout').addEventListener('click', () => finishWorkout(container, day));
  section.querySelector('#btn-cancel-workout').addEventListener('click', () => { activeWorkout = null; section.innerHTML = ''; });
  section.scrollIntoView({ behavior: 'smooth' });
}

function renderExerciseTracker(ex, state) {
  return `
    <div class="exercise-track-card ${state.done ? 'exercise-completed' : ''}" data-ex-id="${ex.id}">
      <div class="exercise-track-header">
        <label class="exercise-done-label">
          <input type="checkbox" class="exercise-done-check" data-ex-id="${ex.id}" ${state.done ? 'checked' : ''}>
          <span class="exercise-track-name">${ex.name}</span>
        </label>
        <div class="exercise-track-meta">
          <span class="sets-reps">${ex.sets} × ${ex.reps}</span>
          <a href="${ex.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="btn-icon yt-link" title="Watch tutorial">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
          </a>
        </div>
      </div>
      <p class="exercise-track-notes text-muted">${ex.notes}</p>

      <div class="set-bubbles-row">
        <span class="set-bubbles-hint">Tap a set to log it</span>
        <div class="set-bubbles">
          ${state.sets.map((s, i) => `
            <button class="set-bubble ${s.done ? 'set-done' : ''}" data-ex-id="${ex.id}" data-set-idx="${i}">${i + 1}</button>
          `).join('')}
        </div>
      </div>

      ${state.sets.map((s, i) => `
        <div class="set-input-row ${s.done ? 'visible' : ''}" data-ex-id="${ex.id}" data-set-idx="${i}">
          <label>Set ${i + 1}</label>
          <input type="number" inputmode="decimal" class="form-input set-reps-input" data-ex-id="${ex.id}" data-set-idx="${i}" placeholder="Reps" value="${s.reps}">
          <input type="number" inputmode="decimal" class="form-input set-weight-input" data-ex-id="${ex.id}" data-set-idx="${i}" placeholder="kg / lbs" value="${s.weight}">
        </div>
      `).join('')}
    </div>
  `;
}

// ── Logging helpers ──────────────────────────────────────────────────────────
function logActivity(type, label, category = type) {
  const todayStr = today();
  DB.update('wt_workoutLog', log => {
    if (!log) log = {};
    log[todayStr] = { type: category, subtype: type, loggedAt: new Date().toISOString() };
    return log;
  });
  showToast(`${label} logged!`);
  navigate('#dashboard');
}

function finishWorkout(container, day) {
  const todayStr       = today();
  const duration       = Math.round((Date.now() - activeWorkout.startTime) / 60000);
  const exercisesDone  = Object.values(activeWorkout.exerciseStates).filter(s => s.done).length;
  const totalExercises = day.exercises.length;

  DB.update('wt_workoutLog', log => {
    if (!log) log = {};
    log[todayStr] = {
      type: 'gym', gymDayId: day.id, gymDayName: day.name,
      duration, exercisesDone, totalExercises,
      exerciseStates: activeWorkout.exerciseStates,
      loggedAt: new Date().toISOString()
    };
    return log;
  });

  activeWorkout = null;
  showToast('Workout logged! 💪');
  navigate('#dashboard');
}
