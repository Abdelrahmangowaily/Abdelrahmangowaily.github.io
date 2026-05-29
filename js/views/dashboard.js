import { DB } from '../db.js';
import { today, getDayName, formatDate } from '../utils.js';
import { navigate } from '../app.js';
import { getCardioMeta } from '../data.js';

export function render(container) {
  const settings = DB.get('wt_settings') || {};
  const weekSchedule = DB.get('wt_weekSchedule') || {};
  const gymDays = DB.get('wt_gymDays') || [];
  const workoutLog = DB.get('wt_workoutLog') || {};
  const foodLog = DB.get('wt_foodLog') || {};

  const todayStr = today();
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const dateDisplay = `${dayNames[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}`;

  // Today's scheduled day
  const todayDayName = getDayName(todayStr);
  const scheduledDayId = weekSchedule[todayDayName];
  const scheduledDay = gymDays.find(d => d.id === scheduledDayId);

  // Stats
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  let weekCount = 0;
  let monthCount = 0;

  const logEntries = Object.entries(workoutLog);
  for (const [dateStr, session] of logEntries) {
    const d = new Date(dateStr + 'T00:00:00');
    if (d >= weekStart && d <= now) weekCount++;
    if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) monthCount++;
  }

  // Streak
  let streak = 0;
  let checkDate = new Date(now);
  while (true) {
    const ds = formatDate(checkDate);
    if (workoutLog[ds] && workoutLog[ds].type !== 'rest') {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Today's nutrition
  const todayFood = foodLog[todayStr] || [];
  const totalCals = todayFood.reduce((s, f) => s + (f.calories || 0), 0);
  const totalProtein = todayFood.reduce((s, f) => s + (f.protein || 0), 0);
  const targetCals = settings.targetCalories || 2400;
  const targetProtein = settings.targetProtein || 165;
  const calPct = Math.min(100, Math.round((totalCals / targetCals) * 100));
  const protPct = Math.min(100, Math.round((totalProtein / targetProtein) * 100));

  // Last 5 gym workouts for the stack
  function daysAgo(dateStr) {
    const diff = Math.round(
      (new Date(todayStr + 'T00:00:00') - new Date(dateStr + 'T00:00:00')) / 86400000
    );
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    return `${diff} days ago`;
  }

  const lastWorkouts = logEntries
    .filter(([, s]) => s.type === 'gym')
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 5);

  // Recent activity
  const recent = logEntries
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 5);

  function sessionIcon(session) {
    if (session.type === 'gym')      return '🏋️';
    if (session.type === 'mobility') return '🧘';
    if (session.type === 'rest')     return '😴';
    const subtype = session.subtype || session.type;
    return getCardioMeta(subtype)?.emoji || '🏃';
  }
  function sessionLabel(session) {
    if (session.type === 'gym') {
      const day = gymDays.find(d => d.id === session.gymDayId);
      return day ? day.name : 'Gym';
    }
    if (session.type === 'mobility') return 'Mobility';
    if (session.type === 'rest')     return 'Rest Day';
    const subtype = session.subtype || session.type;
    return getCardioMeta(subtype)?.label || 'Cardio';
  }

  // Today's workout card
  let todayCard = '';
  if (scheduledDay) {
    todayCard = `
      <div class="card today-workout-card" style="border-left: 4px solid ${scheduledDay.color}">
        <div class="today-workout-header">
          <div>
            <span class="badge" style="background:${scheduledDay.color}22;color:${scheduledDay.color}">${scheduledDay.name}</span>
            <h3>${scheduledDay.subtitle}</h3>
            <p class="text-muted">${scheduledDay.duration} &bull; ${scheduledDay.exercises.length} exercises</p>
          </div>
          <button class="btn btn-primary" id="dash-start-workout">Start Workout</button>
        </div>
      </div>
    `;
  } else {
    const cardioMeta   = getCardioMeta(scheduledDayId);
    const specialLabel = scheduledDayId === 'mobility' ? 'Mobility Day 🧘'
      : cardioMeta ? `${cardioMeta.label} Day ${cardioMeta.emoji}`
      : 'Rest Day 😴';
    todayCard = `
      <div class="card today-workout-card">
        <div class="today-workout-header">
          <div>
            <h3>${specialLabel}</h3>
            <p class="text-muted">Recovery or sport activity scheduled</p>
          </div>
          <button class="btn btn-secondary" id="dash-start-workout">Log Activity</button>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="view-header">
      <div class="view-header-text">
        <h1>${greeting}</h1>
        <p class="text-muted">${dateDisplay}</p>
      </div>
      <button class="ranks-fab" id="ranks-fab-btn" title="Leaderboard">🏆</button>
    </div>

    <section class="dashboard-today">
      <h2 class="section-title">Today's Plan</h2>
      ${todayCard}
    </section>

    ${lastWorkouts.length > 0 ? `
    <section class="dashboard-last-workouts">
      <h2 class="section-title">Last Workouts</h2>
      <div class="last-workouts-stack">
        ${lastWorkouts.map(([dateStr, session]) => {
          const day = gymDays.find(d => d.id === session.gymDayId);
          const name = day ? day.name : (session.gymDayName || 'Gym');
          const color = day ? day.color : 'var(--accent)';
          const sub = day ? day.subtitle : '';
          const done = session.exercisesDone != null
            ? `${session.exercisesDone}/${session.totalExercises} exercises`
            : '';
          const dur = session.duration ? `${session.duration} min` : '';
          const meta = [done, dur].filter(Boolean).join(' · ');
          return `
            <div class="last-workout-item" style="--day-color:${color}">
              <div class="last-workout-color-bar"></div>
              <div class="last-workout-info">
                <span class="last-workout-name">${name}</span>
                ${sub ? `<span class="last-workout-sub">${sub}</span>` : ''}
                ${meta ? `<span class="last-workout-meta">${meta}</span>` : ''}
              </div>
              <span class="last-workout-ago">${daysAgo(dateStr)}</span>
            </div>
          `;
        }).join('')}
      </div>
    </section>
    ` : ''}

    <section class="stats-row">
      <div class="stat-card card">
        <div class="stat-value">${weekCount}</div>
        <div class="stat-label">This Week</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value">${streak}</div>
        <div class="stat-label">Day Streak</div>
      </div>
      <div class="stat-card card">
        <div class="stat-value">${monthCount}</div>
        <div class="stat-label">This Month</div>
      </div>
    </section>

    <section class="dashboard-nutrition">
      <div class="section-header">
        <h2 class="section-title">Today's Nutrition</h2>
        <button class="btn btn-secondary btn-sm" id="dash-log-food">Log Food</button>
      </div>
      <div class="card">
        <div class="nutrition-stat">
          <div class="nutrition-label">
            <span>Calories</span>
            <span>${totalCals} / ${targetCals} kcal</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${calPct}%;background:var(--accent)"></div>
          </div>
        </div>
        <div class="nutrition-stat">
          <div class="nutrition-label">
            <span>Protein</span>
            <span>${totalProtein}g / ${targetProtein}g</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width:${protPct}%;background:var(--purple)"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="dashboard-recent">
      <h2 class="section-title">Recent Activity</h2>
      <div class="card">
        ${recent.length === 0 ? '<p class="empty-state">No activity logged yet. Start your first workout!</p>' : `
          <ul class="activity-list">
            ${recent.map(([dateStr, session]) => {
              const d = new Date(dateStr + 'T00:00:00');
              const label = sessionLabel(session);
              const icon  = sessionIcon(session);
              const badge = session.type === 'gym'
                ? `<span class="badge badge-success">Gym</span>`
                : `<span class="badge badge-info">${label}</span>`;
              return `
                <li class="activity-item">
                  <span class="activity-icon">${icon}</span>
                  <div class="activity-info">
                    <span class="activity-name">${label}</span>
                    <span class="activity-date text-muted">${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  </div>
                  ${badge}
                </li>
              `;
            }).join('')}
          </ul>
        `}
      </div>
    </section>
  `;

  container.querySelector('#dash-start-workout')?.addEventListener('click', () => navigate('#workout'));
  container.querySelector('#dash-log-food')?.addEventListener('click', () => navigate('#nutrition'));
  container.querySelector('#ranks-fab-btn')?.addEventListener('click', () => navigate('#leaderboard'));
}
