import { DB } from '../db.js';
import { formatDate, showModal } from '../utils.js';

export function render(container) {
  const now = new Date();
  _render(container, now.getFullYear(), now.getMonth());
}

function _render(container, year, month) {
  const gymDays = DB.get('wt_gymDays') || [];
  const workoutLog = DB.get('wt_workoutLog') || {};

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const todayStr = formatDate(new Date());
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start on Monday: getDay() returns 0=Sun, shift so Mon=0
  let startOffset = (firstDay.getDay() + 6) % 7; // Mon=0, Sun=6

  // Month stats
  let gymCount = 0, sportCount = 0, restCount = 0;
  for (const [dateStr, session] of Object.entries(workoutLog)) {
    const d = new Date(dateStr + 'T00:00:00');
    if (d.getFullYear() === year && d.getMonth() === month) {
      if (session.type === 'gym') gymCount++;
      else if (session.type === 'rest') restCount++;
      else sportCount++;
    }
  }

  function getTypeColor(type) {
    switch (type) {
      case 'gym': return 'var(--success)';
      case 'skating': return 'var(--info)';
      case 'basketball': return 'var(--warning)';
      case 'mobility': return 'var(--purple)';
      case 'rest': return 'var(--text-muted)';
      default: return 'transparent';
    }
  }

  function getTypeLabel(session, gymDays) {
    if (session.type === 'gym') {
      const day = gymDays.find(d => d.id === session.gymDayId);
      return day ? day.name : 'Gym';
    }
    const labels = { skating: 'Skating', basketball: 'Basketball', mobility: 'Mobility', rest: 'Rest' };
    return labels[session.type] || session.type;
  }

  // Build cells
  let cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) cells.push(d);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

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
        <div class="cal-header">Mon</div>
        <div class="cal-header">Tue</div>
        <div class="cal-header">Wed</div>
        <div class="cal-header">Thu</div>
        <div class="cal-header">Fri</div>
        <div class="cal-header">Sat</div>
        <div class="cal-header">Sun</div>

        ${rows.map(row =>
          row.map(day => {
            if (!day) return `<div class="cal-cell cal-empty"></div>`;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const session = workoutLog[dateStr];
            const isToday = dateStr === todayStr;
            const color = session ? getTypeColor(session.type) : 'transparent';
            return `
              <div class="cal-cell ${isToday ? 'cal-today' : ''} ${session ? 'cal-has-log' : ''}"
                   data-date="${dateStr}"
                   style="${session ? `--dot-color:${color}` : ''}">
                <span class="cal-day-num">${day}</span>
                ${session ? `<div class="cal-dot" style="background:${color}"></div>` : ''}
              </div>
            `;
          }).join('')
        ).join('')}
      </div>

      <div class="cal-legend">
        <div class="legend-item"><span class="legend-dot" style="background:var(--success)"></span> Gym</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--info)"></span> Skating</div>
        <div class="legend-item"><span class="legend-dot" style="background:var(--warning)"></span> Basketball</div>
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
        <div class="stat-value" style="color:var(--info)">${sportCount}</div>
        <div class="stat-label">Sport Days</div>
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

      const d = new Date(dateStr + 'T00:00:00');
      const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      const typeLabel = getTypeLabel(session, gymDays);

      let bodyHTML = `
        <div class="log-detail">
          <p><strong>Date:</strong> ${dateLabel}</p>
          <p><strong>Activity:</strong> ${typeLabel}</p>
      `;

      if (session.type === 'gym') {
        const gymDay = gymDays.find(d => d.id === session.gymDayId);
        if (gymDay) {
          bodyHTML += `<p><strong>Duration:</strong> ${session.duration || '?'} min</p>`;
          bodyHTML += `<p><strong>Exercises:</strong> ${session.exercisesDone || 0} / ${session.totalExercises || gymDay.exercises.length} completed</p>`;
          if (session.exerciseStates) {
            const doneExercises = gymDay.exercises.filter(ex =>
              session.exerciseStates[ex.id]?.done
            );
            if (doneExercises.length > 0) {
              bodyHTML += `<ul class="detail-list">${doneExercises.map(e => `<li>✓ ${e.name}</li>`).join('')}</ul>`;
            }
          }
        }
      }

      bodyHTML += '</div>';

      const idx = await showModal(typeLabel, bodyHTML, [
        { label: 'Close', type: 'secondary' },
        { label: 'Delete Log', type: 'danger' }
      ]);

      if (idx === 1) {
        DB.update('wt_workoutLog', log => {
          delete log[dateStr];
          return log;
        });
        _render(container, year, month);
      }
    });
  });
}
