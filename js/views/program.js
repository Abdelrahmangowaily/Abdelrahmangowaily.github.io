import { DB } from '../db.js';
import { today, formatDate, showModal, showToast, confirm, generateId } from '../utils.js';

export function render(container) {
  _render(container);
}

function _render(container) {
  const gymDays    = DB.get('wt_gymDays')    || [];
  const workoutLog = DB.get('wt_workoutLog') || {};

  // Build a map of gymDayId → most recent log date within last 7 days
  const now = new Date();
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const recentlyTrained = {}; // dayId → dateStr of most recent session in last 7 days
  for (const [dateStr, session] of Object.entries(workoutLog)) {
    if (session.type !== 'gym') continue;
    const d = new Date(dateStr + 'T00:00:00');
    if (d < sevenDaysAgo) continue;
    const prev = recentlyTrained[session.gymDayId];
    if (!prev || dateStr > prev) recentlyTrained[session.gymDayId] = dateStr;
  }

  // Sort: untrained days first (preserving original order), trained days last (oldest first)
  const todayStr = today();
  function daysSince(dateStr) {
    return Math.round((new Date(todayStr + 'T00:00:00') - new Date(dateStr + 'T00:00:00')) / 86400000);
  }

  const sortedDays = [...gymDays].sort((a, b) => {
    const aDate = recentlyTrained[a.id];
    const bDate = recentlyTrained[b.id];
    if (!aDate && !bDate) return 0;       // both untrained → original order
    if (!aDate) return -1;                // a untrained → a first
    if (!bDate) return 1;                 // b untrained → b first
    return aDate.localeCompare(bDate);    // both trained → least recent first
  });

  const categoryColors = {
    skill: '#f59e0b',
    push: '#ef4444',
    pull: '#3b82f6',
    legs: '#10b981',
    core: '#8b5cf6',
    accessory: '#00d4aa',
    mobility: '#10b981'
  };

  container.innerHTML = `
    <div class="view-header">
      <h1>Training Program</h1>
      <p class="text-muted">5-Day Calisthenics Hybrid Program</p>
    </div>

    <div class="program-days" id="program-days">
      ${sortedDays.map((day, dayIdx) => renderDayCard(day, dayIdx, categoryColors, recentlyTrained[day.id], daysSince)).join('')}
    </div>

    <div style="margin-top:1.5rem">
      <button class="btn btn-secondary" id="add-gym-day">+ Add New Gym Day</button>
    </div>
  `;

  // Accordion toggle
  container.querySelectorAll('.day-card-header').forEach(header => {
    header.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const card = header.closest('.day-card');
      card.classList.toggle('expanded');
    });
  });

  // Edit exercise
  container.querySelectorAll('.btn-edit-exercise').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dayId = btn.dataset.dayId;
      const exId = btn.dataset.exId;
      await editExercise(container, dayId, exId);
    });
  });

  // Delete exercise
  container.querySelectorAll('.btn-delete-exercise').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dayId = btn.dataset.dayId;
      const exId = btn.dataset.exId;
      const ok = await confirm('Delete this exercise?');
      if (!ok) return;
      DB.update('wt_gymDays', days => {
        const day = days.find(d => d.id === dayId);
        if (day) day.exercises = day.exercises.filter(e => e.id !== exId);
        return days;
      });
      showToast('Exercise deleted');
      _render(container);
    });
  });

  // Add exercise
  container.querySelectorAll('.btn-add-exercise').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dayId = btn.dataset.dayId;
      await addExercise(container, dayId);
    });
  });

  // Edit day info
  container.querySelectorAll('.btn-edit-day').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dayId = btn.dataset.dayId;
      await editDay(container, dayId);
    });
  });

  // Delete day
  container.querySelectorAll('.btn-delete-day').forEach(btn => {
    btn.addEventListener('click', async () => {
      const dayId = btn.dataset.dayId;
      const ok = await confirm('Delete this gym day and all its exercises?');
      if (!ok) return;
      DB.update('wt_gymDays', days => days.filter(d => d.id !== dayId));
      showToast('Gym day deleted');
      _render(container);
    });
  });

  // Add gym day
  container.querySelector('#add-gym-day')?.addEventListener('click', async () => {
    await addDay(container);
  });
}

function renderDayCard(day, dayIdx, categoryColors, trainedDateStr, daysSinceFn) {
  const trainedDays = trainedDateStr ? daysSinceFn(trainedDateStr) : null;
  const trainedLabel = trainedDays === 0 ? 'Today'
    : trainedDays === 1 ? 'Yesterday'
    : trainedDays != null ? `${trainedDays}d ago` : null;

  return `
    <article class="day-card card" data-day-id="${day.id}">
      <div class="day-card-header" style="border-left: 4px solid ${day.color}">
        <div class="day-card-title">
          <div class="day-meta">
            <span class="day-number">Day ${dayIdx + 1}</span>
            <h3>${day.name}</h3>
            <p class="text-muted">${day.subtitle}</p>
          </div>
          <div class="day-tags">
            <span class="badge" style="background:${day.color}22;color:${day.color}">${day.duration}</span>
            <span class="badge badge-muted">${day.exercises.length} exercises</span>
            ${trainedLabel ? `<span class="trained-stamp">✓ ${trainedLabel}</span>` : ''}
          </div>
        </div>
        <div class="day-card-actions">
          <button class="btn btn-secondary btn-sm btn-edit-day" data-day-id="${day.id}">Edit</button>
          <button class="btn btn-danger btn-sm btn-delete-day" data-day-id="${day.id}">Delete</button>
          <span class="expand-icon">▾</span>
        </div>
      </div>

      <div class="day-card-body">
        <div class="day-focus">
          <p><strong>Focus:</strong> ${day.focus}</p>
          <p><strong>Warm-up:</strong> ${day.warmup}</p>
        </div>

        <div class="table-responsive">
          <table class="exercises-table">
            <thead>
              <tr>
                <th>Exercise</th>
                <th>Sets × Reps</th>
                <th>Notes</th>
                <th>Tutorial</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${day.exercises.map(ex => `
                <tr>
                  <td>
                    <div class="exercise-name">
                      <span class="category-dot" style="background:${categoryColors[ex.category] || '#8b949e'}"></span>
                      ${ex.name}
                    </div>
                  </td>
                  <td><span class="sets-reps">${ex.sets} × ${ex.reps}</span></td>
                  <td class="notes-cell">${ex.notes}</td>
                  <td>
                    <a href="${ex.youtubeUrl}" target="_blank" rel="noopener noreferrer" class="btn-icon yt-link" title="Watch tutorial">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#ff0000"><path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/></svg>
                    </a>
                  </td>
                  <td>
                    <div class="action-btns">
                      <button class="btn btn-icon btn-edit-exercise" data-day-id="${day.id}" data-ex-id="${ex.id}" title="Edit">✏️</button>
                      <button class="btn btn-icon btn-delete-exercise" data-day-id="${day.id}" data-ex-id="${ex.id}" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <button class="btn btn-secondary btn-sm btn-add-exercise" data-day-id="${day.id}" style="margin-top:1rem">+ Add Exercise</button>
      </div>
    </article>
  `;
}

async function editExercise(container, dayId, exId) {
  const gymDays = DB.get('wt_gymDays') || [];
  const day = gymDays.find(d => d.id === dayId);
  const ex = day?.exercises.find(e => e.id === exId);
  if (!ex) return;

  const formId = 'edit-ex-form-' + exId;
  const idx = await showModal('Edit Exercise', `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Exercise Name</label>
        <input type="text" name="name" value="${ex.name}" required class="form-input">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Sets</label>
          <input type="text" name="sets" value="${ex.sets}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Reps / Duration</label>
          <input type="text" name="reps" value="${ex.reps}" required class="form-input">
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes" rows="3" class="form-input">${ex.notes}</textarea>
      </div>
      <div class="form-group">
        <label>YouTube URL</label>
        <input type="url" name="youtubeUrl" value="${ex.youtubeUrl}" class="form-input">
      </div>
      <div class="form-group">
        <label>Category</label>
        <select name="category" class="form-input">
          ${['skill','push','pull','legs','core','accessory','mobility'].map(c =>
            `<option value="${c}" ${ex.category === c ? 'selected' : ''}>${c}</option>`
          ).join('')}
        </select>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Save', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));

  DB.update('wt_gymDays', days => {
    const d = days.find(d => d.id === dayId);
    if (d) {
      const e = d.exercises.find(e => e.id === exId);
      if (e) Object.assign(e, data);
    }
    return days;
  });
  showToast('Exercise updated');
  _render(container);
}

async function addExercise(container, dayId) {
  const formId = 'add-ex-form';
  const idx = await showModal('Add Exercise', `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Exercise Name</label>
        <input type="text" name="name" required class="form-input" placeholder="e.g. Pull-ups">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Sets</label>
          <input type="text" name="sets" required class="form-input" placeholder="4">
        </div>
        <div class="form-group">
          <label>Reps / Duration</label>
          <input type="text" name="reps" required class="form-input" placeholder="8-12">
        </div>
      </div>
      <div class="form-group">
        <label>Notes</label>
        <textarea name="notes" rows="3" class="form-input" placeholder="Technique cues..."></textarea>
      </div>
      <div class="form-group">
        <label>YouTube URL</label>
        <input type="url" name="youtubeUrl" class="form-input" placeholder="https://youtube.com/...">
      </div>
      <div class="form-group">
        <label>Category</label>
        <select name="category" class="form-input">
          ${['skill','push','pull','legs','core','accessory','mobility'].map(c =>
            `<option value="${c}">${c}</option>`
          ).join('')}
        </select>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Add', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));
  data.id = generateId();

  DB.update('wt_gymDays', days => {
    const d = days.find(d => d.id === dayId);
    if (d) d.exercises.push(data);
    return days;
  });
  showToast('Exercise added');
  _render(container);
}

async function editDay(container, dayId) {
  const gymDays = DB.get('wt_gymDays') || [];
  const day = gymDays.find(d => d.id === dayId);
  if (!day) return;

  const formId = 'edit-day-form';
  const idx = await showModal('Edit Day Info', `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Day Name</label>
        <input type="text" name="name" value="${day.name}" required class="form-input">
      </div>
      <div class="form-group">
        <label>Subtitle</label>
        <input type="text" name="subtitle" value="${day.subtitle}" class="form-input">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Duration</label>
          <input type="text" name="duration" value="${day.duration}" class="form-input">
        </div>
        <div class="form-group">
          <label>Color</label>
          <input type="color" name="color" value="${day.color}" class="form-input">
        </div>
      </div>
      <div class="form-group">
        <label>Focus</label>
        <textarea name="focus" rows="3" class="form-input">${day.focus}</textarea>
      </div>
      <div class="form-group">
        <label>Warm-up</label>
        <textarea name="warmup" rows="2" class="form-input">${day.warmup}</textarea>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Save', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));

  DB.update('wt_gymDays', days => {
    const d = days.find(d => d.id === dayId);
    if (d) Object.assign(d, data);
    return days;
  });
  showToast('Day updated');
  _render(container);
}

async function addDay(container) {
  const formId = 'add-day-form';
  const idx = await showModal('Add New Gym Day', `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Day Name</label>
        <input type="text" name="name" required class="form-input" placeholder="e.g. Push C">
      </div>
      <div class="form-group">
        <label>Subtitle</label>
        <input type="text" name="subtitle" class="form-input" placeholder="e.g. Upper body focus">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Duration</label>
          <input type="text" name="duration" class="form-input" placeholder="60-75 min">
        </div>
        <div class="form-group">
          <label>Color</label>
          <input type="color" name="color" value="#00d4aa" class="form-input">
        </div>
      </div>
      <div class="form-group">
        <label>Focus</label>
        <textarea name="focus" rows="3" class="form-input" placeholder="Describe the focus of this day..."></textarea>
      </div>
      <div class="form-group">
        <label>Warm-up</label>
        <textarea name="warmup" rows="2" class="form-input" placeholder="Describe the warm-up routine..."></textarea>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Add Day', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));
  data.id = 'day_' + generateId();
  data.exercises = [];

  DB.update('wt_gymDays', days => [...(days || []), data]);
  showToast('Gym day added');
  _render(container);
}
