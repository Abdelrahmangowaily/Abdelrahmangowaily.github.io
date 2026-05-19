import { DB } from '../db.js';
import { today, getDayName, showToast, showModal, generateId } from '../utils.js';
import { navigate } from '../app.js';

let activeWorkout = null; // { dayId, startTime, sets: { exId: [{reps, weight, done}] } }

export function render(container) {
  activeWorkout = null;
  _renderMain(container);
}

function _renderMain(container) {
  const weekSchedule = DB.get('wt_weekSchedule') || {};
  const gymDays = DB.get('wt_gymDays') || [];
  const todayStr = today();
  const todayDayName = getDayName(todayStr);

  const dayOptions = gymDays.map(d => `<option value="${d.id}">${d.name} — ${d.subtitle}</option>`).join('');
  const specialOptions = `
    <option value="">— Select —</option>
    ${dayOptions}
    <option value="skating">Skating 🛼</option>
    <option value="basketball">Basketball 🏀</option>
    <option value="mobility">Mobility 🧘</option>
    <option value="rest">Rest Day 😴</option>
  `;

  const weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const weekDayLabels = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' };

  function getChipLabel(val) {
    if (!val) return 'Rest';
    const d = gymDays.find(d => d.id === val);
    if (d) return d.name;
    if (val === 'skating') return 'Skate';
    if (val === 'basketball') return 'Ball';
    if (val === 'mobility') return 'Mobility';
    if (val === 'rest') return 'Rest';
    return val;
  }

  function getChipColor(val) {
    if (!val || val === 'rest') return 'var(--bg-elevated)';
    const d = gymDays.find(d => d.id === val);
    if (d) return d.color + '33';
    if (val === 'skating') return '#3b82f622';
    if (val === 'basketball') return '#f59e0b22';
    if (val === 'mobility') return '#10b98122';
    return 'var(--bg-elevated)';
  }

  const scheduledDayId = weekSchedule[todayDayName];
  const scheduledDay = gymDays.find(d => d.id === scheduledDayId);
  const scheduledLabel = scheduledDay ? scheduledDay.name
    : scheduledDayId === 'skating' ? 'Skating 🛼'
    : scheduledDayId === 'basketball' ? 'Basketball 🏀'
    : scheduledDayId === 'mobility' ? 'Mobility 🧘'
    : 'Rest Day 😴';

  container.innerHTML = `
    <div class="view-header">
      <h1>Workout</h1>
      <p class="text-muted">Plan and log your training</p>
    </div>

    <section class="card section-card">
      <h2 class="section-title">Weekly Schedule</h2>
      <p class="text-muted" style="margin-bottom:1rem">Click a day to change its assignment</p>
      <div class="week-row" id="week-row">
        ${weekDays.map(day => `
          <div class="week-chip ${day === todayDayName ? 'week-chip-today' : ''}"
               data-day="${day}"
               style="background:${getChipColor(weekSchedule[day])}">
            <span class="week-chip-label">${weekDayLabels[day]}</span>
            <span class="week-chip-value">${getChipLabel(weekSchedule[day])}</span>
          </div>
        `).join('')}
      </div>
    </section>

    <section class="card section-card">
      <h2 class="section-title">Start Today's Workout</h2>
      <p class="text-muted">Today is <strong>${todayDayName.charAt(0).toUpperCase() + todayDayName.slice(1)}</strong>. Scheduled: <strong>${scheduledLabel}</strong></p>

      <div class="form-row" style="margin-top:1rem;align-items:flex-end">
        <div class="form-group" style="flex:1">
          <label>Override workout selection</label>
          <select id="workout-override" class="form-input">
            ${specialOptions}
          </select>
        </div>
        <button class="btn btn-primary" id="btn-start-workout">Start Workout</button>
      </div>

      <div class="sport-log-btns" style="margin-top:1rem;display:flex;gap:.75rem;flex-wrap:wrap">
        <button class="btn btn-secondary" id="log-skating">Log Skating 🛼</button>
        <button class="btn btn-secondary" id="log-basketball">Log Basketball 🏀</button>
        <button class="btn btn-secondary" id="log-rest">Log Rest Day 😴</button>
      </div>
    </section>

    <div id="active-workout-section"></div>
  `;

  // Week chip click
  container.querySelectorAll('.week-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
      const day = chip.dataset.day;
      await changeScheduleDay(container, day, weekSchedule, gymDays);
    });
  });

  container.querySelector('#btn-start-workout').addEventListener('click', () => {
    const override = container.querySelector('#workout-override').value;
    const dayId = override || scheduledDayId;
    const day = gymDays.find(d => d.id === dayId);
    if (!day) {
      showToast('Please select a gym day to start a workout', 'error');
      return;
    }
    startWorkout(container, day);
  });

  container.querySelector('#log-skating').addEventListener('click', () => logActivity(container, 'skating'));
  container.querySelector('#log-basketball').addEventListener('click', () => logActivity(container, 'basketball'));
  container.querySelector('#log-rest').addEventListener('click', () => logActivity(container, 'rest'));
}

async function changeScheduleDay(container, day, weekSchedule, gymDays) {
  const dayLabels = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' };
  const current = weekSchedule[day];

  const options = [
    { value: '', label: 'Rest / Off' },
    ...gymDays.map(d => ({ value: d.id, label: `${d.name} — ${d.subtitle}` })),
    { value: 'skating', label: 'Skating 🛼' },
    { value: 'basketball', label: 'Basketball 🏀' },
    { value: 'mobility', label: 'Mobility 🧘' }
  ];

  const formId = 'sched-form';
  const idx = await showModal(`Change ${dayLabels[day]}`, `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Assign Activity</label>
        <select name="assignment" class="form-input">
          ${options.map(o => `<option value="${o.value}" ${o.value === (current || '') ? 'selected' : ''}>${o.label}</option>`).join('')}
        </select>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Save', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const val = form.assignment.value;

  DB.update('wt_weekSchedule', sched => {
    sched[day] = val || null;
    return sched;
  });
  showToast('Schedule updated');
  _renderMain(container);
}

function startWorkout(container, day) {
  activeWorkout = {
    dayId: day.id,
    startTime: Date.now(),
    exerciseStates: {}
  };

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

      <div class="warmup-box">
        <strong>Warm-up:</strong> ${day.warmup}
      </div>

      <div class="exercise-tracker" id="exercise-tracker">
        ${day.exercises.map(ex => renderExerciseTracker(ex, activeWorkout.exerciseStates[ex.id])).join('')}
      </div>

      <div class="finish-btns">
        <button class="btn btn-primary btn-lg" id="btn-finish-workout">Finish Workout 💪</button>
        <button class="btn btn-secondary" id="btn-cancel-workout">Cancel</button>
      </div>
    </section>
  `;

  // Set toggle buttons
  section.querySelectorAll('.set-bubble').forEach(bubble => {
    bubble.addEventListener('click', () => {
      const exId = bubble.dataset.exId;
      const setIdx = parseInt(bubble.dataset.setIdx);
      const state = activeWorkout.exerciseStates[exId];
      if (!state) return;

      // Toggle inline input
      const inputRow = section.querySelector(`.set-input-row[data-ex-id="${exId}"][data-set-idx="${setIdx}"]`);
      if (inputRow) {
        inputRow.classList.toggle('visible');
      }

      state.sets[setIdx].done = !state.sets[setIdx].done;
      bubble.classList.toggle('set-done', state.sets[setIdx].done);
    });
  });

  // Set inputs
  section.querySelectorAll('.set-reps-input').forEach(input => {
    input.addEventListener('change', () => {
      const exId = input.dataset.exId;
      const setIdx = parseInt(input.dataset.setIdx);
      activeWorkout.exerciseStates[exId].sets[setIdx].reps = input.value;
    });
  });
  section.querySelectorAll('.set-weight-input').forEach(input => {
    input.addEventListener('change', () => {
      const exId = input.dataset.exId;
      const setIdx = parseInt(input.dataset.setIdx);
      activeWorkout.exerciseStates[exId].sets[setIdx].weight = input.value;
    });
  });

  // Exercise done checkbox
  section.querySelectorAll('.exercise-done-check').forEach(cb => {
    cb.addEventListener('change', () => {
      const exId = cb.dataset.exId;
      activeWorkout.exerciseStates[exId].done = cb.checked;
      const card = cb.closest('.exercise-track-card');
      card.classList.toggle('exercise-completed', cb.checked);
    });
  });

  section.querySelector('#btn-finish-workout').addEventListener('click', () => {
    finishWorkout(container, day);
  });

  section.querySelector('#btn-cancel-workout').addEventListener('click', () => {
    activeWorkout = null;
    section.innerHTML = '';
  });

  section.scrollIntoView({ behavior: 'smooth' });
}

function renderExerciseTracker(ex, state) {
  const numSets = state.sets.length;
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

      <div class="set-bubbles">
        ${state.sets.map((s, i) => `
          <button class="set-bubble ${s.done ? 'set-done' : ''}" data-ex-id="${ex.id}" data-set-idx="${i}">
            ${i + 1}
          </button>
        `).join('')}
      </div>

      ${state.sets.map((s, i) => `
        <div class="set-input-row ${s.done ? 'visible' : ''}" data-ex-id="${ex.id}" data-set-idx="${i}">
          <label>Set ${i + 1}</label>
          <input type="text" class="form-input set-reps-input" data-ex-id="${ex.id}" data-set-idx="${i}" placeholder="reps" value="${s.reps}">
          <input type="text" class="form-input set-weight-input" data-ex-id="${ex.id}" data-set-idx="${i}" placeholder="kg/lbs" value="${s.weight}">
        </div>
      `).join('')}
    </div>
  `;
}

function logActivity(container, type) {
  const todayStr = today();
  const typeLabels = { skating: 'Skating', basketball: 'Basketball', rest: 'Rest Day' };

  DB.update('wt_workoutLog', log => {
    if (!log) log = {};
    log[todayStr] = { type, loggedAt: new Date().toISOString() };
    return log;
  });
  showToast(`${typeLabels[type]} logged!`);
  navigate('#dashboard');
}

function finishWorkout(container, day) {
  const todayStr = today();
  const duration = Math.round((Date.now() - activeWorkout.startTime) / 60000);
  const exercisesDone = Object.values(activeWorkout.exerciseStates).filter(s => s.done).length;
  const totalExercises = day.exercises.length;

  const sessionLog = {
    type: 'gym',
    gymDayId: day.id,
    gymDayName: day.name,
    duration,
    exercisesDone,
    totalExercises,
    exerciseStates: activeWorkout.exerciseStates,
    loggedAt: new Date().toISOString()
  };

  DB.update('wt_workoutLog', log => {
    if (!log) log = {};
    log[todayStr] = sessionLog;
    return log;
  });

  activeWorkout = null;
  showToast('Workout logged! 💪');
  navigate('#dashboard');
}
