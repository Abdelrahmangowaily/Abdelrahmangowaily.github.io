import { DB } from '../db.js';
import { formatDate, showModal } from '../utils.js';
import { getCardioMeta } from '../data.js';

export function render(container) {
  const now = new Date();
  _render(container, now.getFullYear(), now.getMonth());
}

function _render(container, year, month) {
  const gymDays    = DB.get('wt_gymDays')    || [];
  const workoutLog = DB.get('wt_workoutLog') || {};

  const monthNames = ['January','February','March','April','May','June',
    'July','August','September','October','November','December'];

  const todayStr = formatDate(new Date());
  const firstDay = new Date(year, month, 1);
  const lastDay  = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Mon=0

  // Month stats
  let gymCount = 0, cardioCount = 0, restCount = 0;
  for (const [dateStr, session] of Object.entries(workoutLog)) {
    const d = new Date(dateStr + 'T00:00:00');
    if (d.getFullYear() !== year || d.getMonth() !== month) continue;
    if (session.type === 'gym') gymCount++;
    else if (session.type === 'rest') restCount++;
    else cardioCount++; // cardio, mobility, and any legacy subtype
  }

  // Resolve colour for a session dot
  function dotColor(session) {
    if (!session) return 'transparent';
    if (session.type === 'gym')      return 'var(--success)';
    if (session.type === 'mobility') return 'var(--purple)';
    if (session.type === 'rest')     return 'var(--text-muted)';
    // cardio (new format stores subtype) or legacy direct type
    const subtype = session.subtype || session.type;
    const meta = getCardioMeta(subtype);
    return meta ? meta.color : 'var(--info)';
  }

  // Human-readable label for the detail modal title
  function sessionLabel(session) {
    if (session.type === 'gym') {
      const day = gymDays.find(d => d.id === session.gymDayId);
      return day ? day.name : 'Gym';
    }
    if (session.type === 'mobility') return 'Mobility 🧘';
    if (session.type === 'rest')     return 'Rest Day 😴';
    const subtype = session.subtype || session.type;
    const meta = getCardioMeta(subtype);
    return meta ? `${meta.emoji} ${meta.label}` : 'Cardio';
  }

  // Build grid cells
  const cells = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1),
  ];
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  container.innerHTML = `
    <div class="view-header">
      <h1>Calendar</h1>
      <p class="text-muted">Training history overview</p>
    </div>

    <div class="card">
      <div class="calendar-nav">
        <button class="btn btn-icon" id="cal-prev">&#8249;</button>
        <h2>${monthNames[month]} ${year}</h2>
        <button class="btn btn-icon" id="cal-next">&#8250;</button>
      </div>

      <div class="calendar-grid">
        ${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => `<div class="cal-header">${d}</div>`).join('')}
        ${rows.map(row => row.map(day => {
          if (!day) return `<div class="cal-cell cal-empty"></div>`;
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
          const session = workoutLog[dateStr];
          const color   = dotColor(session);
          return `
            <div class="cal-cell ${dateStr === todayStr ? 'cal-today' : ''} ${session ? 'cal-has-log' : ''}"
                 data-date="${dateStr}">
              <span class="cal-day-num">${day}</span>
              ${session ? `<div class="cal-dot" style="background:${color}"></div>` : ''}
            </div>
          `;
        }).join('')).join('')}
      </div>

      <div class="cal-legend">
        <div class="legend-item"><span class="legend-dot" style="background:var(--success)"></span> Gym</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--info)"></span> Cardio</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--purple)"></span> Mobility</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--text-muted)"></span> Rest</div>
      </div>
    </div>

    <div class="stats-row" style="margin-top:1rem">
      <div class="stat-card card">
        <div class="stat-value" style="color:var(--success)">${gymCount}</div>
        <div class="stat-label">Gym Days</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value" style="color:var(--info)">${cardioCount}</div>
        <div class="stat-label">Cardio Days</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value" style="color:var(--text-muted)">${restCount}</div>
        <div class="stat-label">Rest Days</div>
      </div>
    </div>
  `;

  container.querySelector('#cal-prev').addEventListener('click', () => {
    const d = new Date(year, month - 1, 1);
    _render(container, d.getFullYear(), d.getMonth());
  });
  container.querySelector('#cal-next').addEventListener('click', () => {
    const d = new Date(year, month + 1, 1);
    _render(container, d.getFullYear(), d.getMonth());
  });

  container.querySelectorAll('.cal-cell.cal-has-log').forEach(cell => {
    cell.addEventListener('click', async () => {
      const dateStr = cell.dataset.date;
      const session = workoutLog[dateStr];
      if (!session) return;

      const dateLabel = new Date(dateStr + 'T00:00:00')
        .toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const label = sessionLabel(session);

      let bodyHTML = `<div class="log-detail">
        <p><strong>Date:</strong> ${dateLabel}</p>
        <p><strong>Activity:</strong> ${label}</p>`;

      if (session.type === 'gym') {
        const gymDay = gymDays.find(d => d.id === session.gymDayId);
        if (gymDay) {
          bodyHTML += `<p><strong>Duration:</strong> ${session.duration || '?'} min</p>`;
          bodyHTML += `<p><strong>Exercises:</strong> ${session.exercisesDone || 0} / ${session.totalExercises || gymDay.exercises.length} completed</p>`;
          const done = gymDay.exercises.filter(ex => session.exerciseStates?.[ex.id]?.done);
          if (done.length) bodyHTML += `<ul class="detail-list">${done.map(e => `<li>✓ ${e.name}</li>`).join('')}</ul>`;
        }
      }

      bodyHTML += '</div>';

      const idx = await showModal(label, bodyHTML, [
        { label: 'Close', type: 'secondary' },
        { label: 'Delete Log', type: 'danger' },
      ]);

      if (idx === 1) {
        DB.update('wt_workoutLog', log => { delete log[dateStr]; return log; });
        _render(container, year, month);
      }
    });
  });
}
