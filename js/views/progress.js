import { DB } from '../db.js';
import { today, formatDate, showToast } from '../utils.js';

const SKILL_LADDERS = {
  pullup: {
    label: 'Pull-up',
    stages: ['Dead hang 20s', 'Scap pull-ups', 'Negatives (5s)', 'Band-assisted', 'Full pull-up', 'Weighted / Archer']
  },
  pushup: {
    label: 'Push-up',
    stages: ['Wall push-ups', 'Incline push-ups', 'Knee push-ups', 'Full push-ups', 'Decline push-ups', 'Diamond / Archer']
  },
  dip: {
    label: 'Dip',
    stages: ['Bench dips', 'Bench dips elevated', 'Ring dips (assisted)', 'Parallel bar dips', 'Weighted dips', 'Ring dips (strict)']
  },
  handstand: {
    label: 'Handstand',
    stages: ['Pike push-ups', 'Elevated pike push-ups', 'Wall kicks', 'Wall hold 30s', 'Freestanding attempts', 'HSPU negatives / Full HSPU']
  },
  lsit: {
    label: 'L-sit',
    stages: ['Tuck hold (floor)', 'Tuck hold (bars)', 'One-leg extended', 'Full L-sit (5s)', 'Full L-sit (10s+)']
  },
  frontlever: {
    label: 'Front Lever',
    stages: ['Tuck front lever', 'Advanced tuck', 'Straddle front lever', 'One-leg front lever', 'Full front lever (3s+)']
  },
  squat: {
    label: 'Squat',
    stages: ['Box squat (high)', 'Box squat (parallel)', 'Goblet squat', 'Bodyweight squat', 'Pistol squat (assisted)', 'Pistol squat (full)']
  }
};

export function render(container) {
  const workoutLog = DB.get('wt_workoutLog') || {};
  const foodLog = DB.get('wt_foodLog') || {};
  const settings = DB.get('wt_settings') || {};
  const gymDays = DB.get('wt_gymDays') || [];

  const logEntries = Object.entries(workoutLog).sort((a, b) => a[0].localeCompare(b[0]));
  const totalWorkouts = logEntries.filter(([, s]) => s.type === 'gym').length;

  // Streak
  const now = new Date();
  let streak = 0;
  let checkDate = new Date(now);
  while (true) {
    const ds = formatDate(checkDate);
    if (workoutLog[ds] && workoutLog[ds].type !== 'rest') {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else break;
  }

  // Longest streak
  let longestStreak = 0;
  let currentRun = 0;
  let prevDate = null;
  for (const [dateStr, session] of logEntries) {
    if (session.type === 'rest') { currentRun = 0; prevDate = null; continue; }
    if (prevDate) {
      const d1 = new Date(prevDate + 'T00:00:00');
      const d2 = new Date(dateStr + 'T00:00:00');
      const diff = (d2 - d1) / 86400000;
      if (diff === 1) { currentRun++; }
      else { currentRun = 1; }
    } else { currentRun = 1; }
    if (currentRun > longestStreak) longestStreak = currentRun;
    prevDate = dateStr;
  }

  // Weeks since start
  const startDate = settings.startDate ? new Date(settings.startDate) : new Date(logEntries[0]?.[0] + 'T00:00:00' || now);
  const weeksSinceStart = Math.max(1, Math.round((now - startDate) / (7 * 86400000)));

  // Weekly volume: last 8 weeks
  const weeklyData = [];
  for (let w = 7; w >= 0; w--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - w * 7);
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    let count = 0;
    for (const [dateStr, session] of logEntries) {
      const d = new Date(dateStr + 'T00:00:00');
      if (d >= weekStart && d <= weekEnd && session.type !== 'rest') count++;
    }
    weeklyData.push({ label: `W${8 - w}`, count });
  }
  const maxWeeklyCount = Math.max(1, ...weeklyData.map(w => w.count));

  // Muscle group frequency this month
  const pushDays = new Set(['day1', 'day3']);
  const pullDays = new Set(['day2', 'day4']);
  let pushCount = 0, pullCount = 0, coreCount = 0, mobilityCount = 0;
  for (const [dateStr, session] of logEntries) {
    const d = new Date(dateStr + 'T00:00:00');
    if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) continue;
    if (session.type === 'gym') {
      if (pushDays.has(session.gymDayId)) pushCount++;
      if (pullDays.has(session.gymDayId)) pullCount++;
      coreCount++; // all gym days have core
    }
    if (session.type === 'mobility') mobilityCount++;
  }

  // Nutrition compliance last 14 days
  let daysWithLog = 0, daysHitProtein = 0;
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const ds = formatDate(d);
    const entries = foodLog[ds];
    if (entries && entries.length > 0) {
      daysWithLog++;
      const totalProt = entries.reduce((s, f) => s + (f.protein || 0), 0);
      if (totalProt >= (settings.targetProtein || 165)) daysHitProtein++;
    }
  }

  // Skill stages
  const skillStages = settings.skillStages || {};

  // Body stats
  const bodyStats = settings.bodyStats || [];
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

    <div class="card" style="margin-top:1rem">
      <h3 style="margin-bottom:1.25rem">Skill Progression Tracker</h3>
      <div id="skill-tracker">
        ${Object.entries(SKILL_LADDERS).map(([key, ladder]) => {
          const currentStage = parseInt(skillStages[key] || 0);
          const maxStage = ladder.stages.length - 1;
          const pct = Math.round((currentStage / maxStage) * 100);
          return `
            <div class="skill-row">
              <div class="skill-info">
                <span class="skill-name">${ladder.label}</span>
                <span class="skill-stage text-muted">${ladder.stages[currentStage]}</span>
              </div>
              <div class="skill-progress-wrap">
                <div class="progress-bar">
                  <div class="progress-fill" style="width:${pct}%;background:var(--accent)"></div>
                </div>
                <span class="skill-pct text-muted">${currentStage + 1}/${maxStage + 1}</span>
              </div>
              <select class="form-input skill-select" data-key="${key}" style="width:auto;min-width:200px">
                ${ladder.stages.map((stage, i) => `<option value="${i}" ${i === currentStage ? 'selected' : ''}>${i + 1}. ${stage}</option>`).join('')}
              </select>
            </div>
          `;
        }).join('')}
        <button class="btn btn-primary" id="save-skills" style="margin-top:1rem">Save Progress</button>
      </div>
    </div>

    <div class="card" style="margin-top:1rem">
      <div class="section-header">
        <h3>Body Stats</h3>
      </div>
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
              const prev = recentStats[i + 1];
              const change = prev ? (stat.weight - prev.weight).toFixed(1) : null;
              const changeColor = change === null ? '' : change > 0 ? 'var(--danger)' : change < 0 ? 'var(--success)' : '';
              return `
                <tr>
                  <td>${stat.date}</td>
                  <td>${stat.weight} kg</td>
                  <td style="color:${changeColor}">${change !== null ? (change > 0 ? '+' : '') + change + ' kg' : '—'}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        ${bodyStats.length > 1 ? renderWeightTrend(bodyStats) : ''}
      `}
    </div>
  `;

  container.querySelector('#save-skills').addEventListener('click', () => {
    const stages = {};
    container.querySelectorAll('.skill-select').forEach(sel => {
      stages[sel.dataset.key] = parseInt(sel.value);
    });
    DB.update('wt_settings', s => ({ ...s, skillStages: stages }));
    showToast('Skill progress saved');
    render(container);
  });

  container.querySelector('#body-stat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.weight) { showToast('Enter a weight', 'error'); return; }
    DB.update('wt_settings', s => {
      if (!s.bodyStats) s.bodyStats = [];
      const existing = s.bodyStats.findIndex(b => b.date === data.date);
      if (existing >= 0) s.bodyStats[existing].weight = parseFloat(data.weight);
      else s.bodyStats.push({ date: data.date, weight: parseFloat(data.weight) });
      s.bodyStats.sort((a, b) => a.date.localeCompare(b.date));
      return s;
    });
    showToast('Weight logged');
    render(container);
  });
}

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
  const minW = Math.min(...weights) - 1;
  const maxW = Math.max(...weights) + 1;
  const range = maxW - minW;
  const W = 300, H = 80;

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
