import { DB } from '../db.js';
import { today, formatDate, showToast, showModal, confirm, generateId } from '../utils.js';

export function render(container) {
  const workoutLog = DB.get('wt_workoutLog') || {};
  const foodLog    = DB.get('wt_foodLog')    || {};
  const settings   = DB.get('wt_settings')   || {};
  const gymDays    = DB.get('wt_gymDays')    || [];
  const skills     = DB.get('wt_skills')     || [];

  const logEntries   = Object.entries(workoutLog).sort((a, b) => a[0].localeCompare(b[0]));
  const totalWorkouts = logEntries.filter(([, s]) => s.type === 'gym').length;

  // ── Streak ──────────────────────────────────────────────────────────────
  const now = new Date();
  let streak = 0;
  let checkDate = new Date(now);
  while (true) {
    const ds = formatDate(checkDate);
    if (workoutLog[ds] && workoutLog[ds].type !== 'rest') { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  let longestStreak = 0, currentRun = 0, prevDate = null;
  for (const [dateStr, session] of logEntries) {
    if (session.type === 'rest') { currentRun = 0; prevDate = null; continue; }
    if (prevDate) {
      const diff = (new Date(dateStr + 'T00:00:00') - new Date(prevDate + 'T00:00:00')) / 86400000;
      currentRun = diff === 1 ? currentRun + 1 : 1;
    } else { currentRun = 1; }
    if (currentRun > longestStreak) longestStreak = currentRun;
    prevDate = dateStr;
  }

  const startDate = settings.startDate
    ? new Date(settings.startDate)
    : new Date(logEntries[0]?.[0] + 'T00:00:00' || now);
  const weeksSinceStart = Math.max(1, Math.round((now - startDate) / (7 * 86400000)));

  // ── Weekly volume ────────────────────────────────────────────────────────
  const weeklyData = [];
  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(now); weekEnd.setDate(now.getDate() - w * 7);
    const weekStart = new Date(weekEnd); weekStart.setDate(weekEnd.getDate() - 6);
    let count = 0;
    for (const [dateStr, session] of logEntries) {
      const d = new Date(dateStr + 'T00:00:00');
      if (d >= weekStart && d <= weekEnd && session.type !== 'rest') count++;
    }
    weeklyData.push({ label: `W${8 - w}`, count });
  }
  const maxWeeklyCount = Math.max(1, ...weeklyData.map(w => w.count));

  // ── Muscle frequency ─────────────────────────────────────────────────────
  const pushDays = new Set(['day1', 'day3']);
  const pullDays = new Set(['day2', 'day4']);
  let pushCount = 0, pullCount = 0, coreCount = 0, mobilityCount = 0;
  for (const [dateStr, session] of logEntries) {
    const d = new Date(dateStr + 'T00:00:00');
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
    if (session.type === 'gym') {
      if (pushDays.has(session.gymDayId)) pushCount++;
      if (pullDays.has(session.gymDayId)) pullCount++;
      coreCount++;
    }
    if (session.type === 'mobility') mobilityCount++;
  }

  // ── Nutrition compliance ─────────────────────────────────────────────────
  let daysWithLog = 0, daysHitProtein = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(now); d.setDate(now.getDate() - i);
    const entries = foodLog[formatDate(d)];
    if (entries && entries.length > 0) {
      daysWithLog++;
      if (entries.reduce((s, f) => s + (f.protein || 0), 0) >= (settings.targetProtein || 165)) daysHitProtein++;
    }
  }

  // ── Body stats ───────────────────────────────────────────────────────────
  const bodyStats  = settings.bodyStats || [];
  const recentStats = bodyStats.slice(-5).reverse();

  container.innerHTML = `
    <div class="view-header">
      <h1>Progress</h1>
      <p class="text-muted">Track your gains over time</p>
    </div>

    <div class="stats-row">
      <div class="stat-card card">
        <div class="stat-value">${totalWorkouts}</div>
        <div class="stat-label">Total Workouts</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value" style="color:var(--accent)">${streak}</div>
        <div class="stat-label">Current Streak</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value">${longestStreak}</div>
        <div class="stat-label">Longest Streak</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value">${weeksSinceStart}</div>
        <div class="stat-label">Weeks Training</div>
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <h3 style="margin-bottom:1.25rem">Weekly Volume — Last 8 Weeks</h3>
      <div class="bar-chart">
        ${weeklyData.map(w => `
          <div class="bar-chart-col">
            <div class="bar-chart-bar-wrap">
              <div class="bar-chart-bar" style="height:${Math.round((w.count / maxWeeklyCount) * 100)}%"></div>
            </div>
            <div class="bar-chart-val">${w.count}</div>
            <div class="bar-chart-label">${w.label}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <h3 style="margin-bottom:1.25rem">Muscle Group Frequency — This Month</h3>
      <div class="muscle-freq">
        ${renderMuscleBar('Push', pushCount, 'var(--danger)')}
        ${renderMuscleBar('Pull', pullCount, 'var(--info)')}
        ${renderMuscleBar('Core', coreCount, 'var(--purple)')}
        ${renderMuscleBar('Mobility', mobilityCount, 'var(--success)')}
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <h3 style="margin-bottom:.5rem">Nutrition Compliance — Last 14 Days</h3>
      <div class="nutrition-compliance">
        <div class="compliance-item">
          <span class="compliance-pct" style="color:var(--accent)">${Math.round((daysWithLog / 14) * 100)}%</span>
          <span class="text-muted">Days with food log (${daysWithLog}/14)</span>
        </div>
        <div class="compliance-item">
          <span class="compliance-pct" style="color:var(--purple)">${Math.round((daysHitProtein / 14) * 100)}%</span>
          <span class="text-muted">Days hitting protein target (${daysHitProtein}/14)</span>
        </div>
      </div>
    </div>

    <!-- ── Skill Tracker ── -->
    <div class="card" style="margin-top:1rem">
      <div class="section-header" style="margin-bottom:1rem">
        <h3>Skill Tracker</h3>
        <button class="btn btn-primary btn-sm" id="btn-add-skill">+ Add Skill</button>
      </div>
      <div id="skill-list">
        ${skills.length === 0
          ? `<p class="empty-state text-muted" style="text-align:center;padding:2rem 0">
               No skills tracked yet.<br>Add your first skill to start logging progress.
             </p>`
          : skills.map(skill => renderSkillCard(skill)).join('')
        }
      </div>
    </div>

    <!-- ── Body Stats ── -->
    <div class="card" style="margin-top:1rem">
      <div class="section-header"><h3>Body Stats</h3></div>
      <form id="body-stat-form" class="form-row" style="margin-bottom:1rem">
        <div class="form-group">
          <label>Date</label>
          <input type="date" name="date" value="${today()}" class="form-input">
        </div>
        <div class="form-group">
          <label>Weight (kg)</label>
          <input type="number" name="weight" step="0.1" class="form-input" placeholder="92.5">
        </div>
        <button type="submit" class="btn btn-secondary" style="align-self:flex-end">Log</button>
      </form>
      ${bodyStats.length === 0 ? '<p class="empty-state text-muted">No body stats logged yet</p>' : `
        <table class="exercises-table">
          <thead><tr><th>Date</th><th>Weight</th><th>Change</th></tr></thead>
          <tbody>
            ${recentStats.map((stat, i) => {
              const prev   = recentStats[i + 1];
              const change = prev ? (stat.weight - prev.weight).toFixed(1) : null;
              const color  = change === null ? '' : change > 0 ? 'var(--danger)' : change < 0 ? 'var(--success)' : '';
              return `<tr>
                <td>${stat.date}</td>
                <td>${stat.weight} kg</td>
                <td style="color:${color}">${change !== null ? (change > 0 ? '+' : '') + change + ' kg' : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
        ${bodyStats.length > 1 ? renderWeightTrend(bodyStats) : ''}
      `}
    </div>
  `;

  // ── Wire events ──────────────────────────────────────────────────────────
  container.querySelector('#btn-add-skill').addEventListener('click', () => addSkill(container));

  container.querySelectorAll('.btn-log-skill').forEach(btn => {
    btn.addEventListener('click', () => {
      const skill = skills.find(s => s.id === btn.dataset.id);
      if (skill) logSkillEntry(container, skill);
    });
  });

  container.querySelectorAll('.btn-delete-skill').forEach(btn => {
    btn.addEventListener('click', () => deleteSkill(container, btn.dataset.id));
  });

  container.querySelector('#body-stat-form').addEventListener('submit', e => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.weight) { showToast('Enter a weight', 'error'); return; }
    DB.update('wt_settings', s => {
      if (!s.bodyStats) s.bodyStats = [];
      const idx = s.bodyStats.findIndex(b => b.date === data.date);
      if (idx >= 0) s.bodyStats[idx].weight = parseFloat(data.weight);
      else s.bodyStats.push({ date: data.date, weight: parseFloat(data.weight) });
      s.bodyStats.sort((a, b) => a.date.localeCompare(b.date));
      return s;
    });
    showToast('Weight logged');
    render(container);
  });
}

// ── Skill card HTML ──────────────────────────────────────────────────────────
function renderSkillCard(skill) {
  const logs    = [...(skill.logs || [])].sort((a, b) => a.date.localeCompare(b.date));
  const best    = logs.length ? Math.max(...logs.map(l => l.value)) : null;
  const latest  = logs.at(-1);
  const unit    = skill.unit === 'seconds' ? 's' : 'reps';
  const recentLogs = logs.slice(-5).reverse();

  const sparkline = logs.length >= 2 ? renderSparkline(logs) : '';

  return `
    <div class="skill-card" data-id="${skill.id}">
      <div class="skill-card-header">
        <div class="skill-card-info">
          <span class="skill-card-name">${skill.name}</span>
          <span class="skill-unit-badge">${skill.unit === 'seconds' ? '⏱ seconds' : '🔁 reps'}</span>
        </div>
        <div class="skill-card-actions">
          <span class="skill-best" title="Personal best">${best !== null ? `PB: ${best}${unit}` : 'No logs yet'}</span>
          <button class="btn btn-primary btn-sm btn-log-skill" data-id="${skill.id}">+ Log</button>
          <button class="btn btn-ghost btn-sm btn-delete-skill" data-id="${skill.id}" title="Delete skill">🗑</button>
        </div>
      </div>
      ${sparkline}
      ${recentLogs.length > 0 ? `
        <div class="skill-log-history">
          ${recentLogs.map(l => `
            <div class="skill-log-row">
              <span class="skill-log-date">${l.date}</span>
              <span class="skill-log-value">${l.value} ${unit}</span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function renderSparkline(logs) {
  const recent = logs.slice(-10);
  const values = recent.map(l => l.value);
  const minV   = Math.min(...values);
  const maxV   = Math.max(...values);
  const range  = maxV - minV || 1;
  const W = 240, H = 48;

  const pts = recent.map((l, i) => {
    const x = (i / Math.max(1, recent.length - 1)) * W;
    const y = H - ((l.value - minV) / range) * H;
    return `${x},${y}`;
  });

  return `
    <div class="skill-sparkline">
      <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:48px">
        <polyline points="${pts.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
        <circle cx="${pts.at(-1).split(',')[0]}" cy="${pts.at(-1).split(',')[1]}" r="3" fill="var(--accent)"/>
      </svg>
    </div>
  `;
}

// ── Add skill ────────────────────────────────────────────────────────────────
async function addSkill(container) {
  const formId = 'add-skill-form';
  const idx = await showModal('Add New Skill', `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Skill Name</label>
        <input type="text" name="name" class="form-input" placeholder="e.g. Pull-up, Handstand hold…" autocomplete="off" required>
      </div>
      <div class="form-group">
        <label>Tracking Method</label>
        <div class="unit-toggle">
          <label class="unit-option">
            <input type="radio" name="unit" value="reps" checked>
            <span>🔁 Reps</span>
          </label>
          <label class="unit-option">
            <input type="radio" name="unit" value="seconds">
            <span>⏱ Seconds</span>
          </label>
        </div>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Add Skill', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const name = form.name.value.trim();
  const unit = form.unit.value;
  if (!name) { showToast('Enter a skill name', 'error'); return; }

  const newSkill = { id: generateId(), name, unit, logs: [] };
  DB.update('wt_skills', skills => {
    if (!skills) skills = [];
    skills.push(newSkill);
    return skills;
  });
  showToast(`${name} added!`);
  render(container);
}

// ── Log skill entry ──────────────────────────────────────────────────────────
async function logSkillEntry(container, skill) {
  const unit   = skill.unit === 'seconds' ? 'Seconds' : 'Reps';
  const formId = 'log-skill-form';
  const idx    = await showModal(`Log ${skill.name}`, `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Date</label>
        <input type="date" name="date" value="${today()}" class="form-input">
      </div>
      <div class="form-group">
        <label>${unit}</label>
        <input type="number" name="value" inputmode="decimal" class="form-input" placeholder="e.g. 10" min="0" required>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Save', type: 'primary' }]);

  if (idx !== 1) return;

  const form  = document.getElementById(formId);
  const date  = form.date.value;
  const value = parseFloat(form.value.value);
  if (!date || isNaN(value)) { showToast('Enter a valid value', 'error'); return; }

  DB.update('wt_skills', skills => {
    const skill_ = skills.find(s => s.id === skill.id);
    if (!skill_) return skills;
    if (!skill_.logs) skill_.logs = [];
    const existing = skill_.logs.findIndex(l => l.date === date);
    if (existing >= 0) skill_.logs[existing].value = value;
    else skill_.logs.push({ date, value });
    skill_.logs.sort((a, b) => a.date.localeCompare(b.date));
    return skills;
  });
  showToast(`${skill.name} logged: ${value} ${skill.unit === 'seconds' ? 's' : 'reps'}`);
  render(container);
}

// ── Delete skill ─────────────────────────────────────────────────────────────
async function deleteSkill(container, skillId) {
  const skills = DB.get('wt_skills') || [];
  const skill  = skills.find(s => s.id === skillId);
  if (!skill) return;

  const ok = await confirm(`Delete "${skill.name}" and all its logs?`);
  if (!ok) return;

  DB.update('wt_skills', list => list.filter(s => s.id !== skillId));
  showToast('Skill deleted');
  render(container);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function renderMuscleBar(label, count, color) {
  return `
    <div class="muscle-bar-row">
      <span class="muscle-bar-label">${label}</span>
      <div class="muscle-bar-wrap">
        <div class="muscle-bar" style="width:${Math.min(100, count * 15)}%;background:${color}"></div>
      </div>
      <span class="muscle-bar-count">${count}x</span>
    </div>
  `;
}

function renderWeightTrend(bodyStats) {
  const recent = bodyStats.slice(-8);
  const weights = recent.map(s => s.weight);
  const minW = Math.min(...weights) - 1, maxW = Math.max(...weights) + 1;
  const range = maxW - minW, W = 300, H = 80;
  const points = recent.map((s, i) => {
    const x = (i / Math.max(1, recent.length - 1)) * W;
    const y = H - ((s.weight - minW) / range) * H;
    return `${x},${y}`;
  });
  return `
    <div style="margin-top:1rem">
      <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:80px;overflow:visible">
        <polyline points="${points.join(' ')}" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round"/>
        ${recent.map((s, i) => {
          const x = (i / Math.max(1, recent.length - 1)) * W;
          const y = H - ((s.weight - minW) / range) * H;
          return `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)"/>`;
        }).join('')}
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:.7rem;color:var(--text-muted)">
        ${recent.map(s => `<span>${s.date.slice(5)}</span>`).join('')}
      </div>
    </div>
  `;
}
