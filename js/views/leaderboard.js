import { fetchSnapshot } from '../db.js';
import { formatDate } from '../utils.js';

// ── User roster ──────────────────────────────────────────────────────────────
const USERS = ['boudy', 'hamza', 'youssef', 'boba', 'xeina'];
const USER_META = {
  boudy:   { display: 'Boudy',   initials: 'B',  color: '#0ab8d4' },
  hamza:   { display: 'Hamza',   initials: 'H',  color: '#e05040' },
  youssef: { display: 'Youssef', initials: 'Y',  color: '#8b5cf6' },
  boba:    { display: 'Boba',    initials: 'Bo', color: '#1a9060' },
  xeina:   { display: 'Xeina',  initials: 'X',  color: '#c89010' },
};

const MEDALS = ['🥇', '🥈', '🥉'];

// ── Weight class labels ──────────────────────────────────────────────────────
function weightClass(kg) {
  if (!kg)      return { label: 'Unknown', color: '#888' };
  if (kg <  60) return { label: '< 60 kg',    color: '#06b6d4' };
  if (kg <  70) return { label: '60–70 kg',   color: '#22c55e' };
  if (kg <  80) return { label: '70–80 kg',   color: '#f59e0b' };
  if (kg <  90) return { label: '80–90 kg',   color: '#f97316' };
  if (kg < 100) return { label: '90–100 kg',  color: '#e05040' };
  return               { label: '100 kg+',    color: '#8b5cf6' };
}

// ── Scoring ──────────────────────────────────────────────────────────────────
/**
 * Allometric scaling for bodyweight calisthenics.
 * Heavier athletes need more relative strength to perform the same movement,
 * so their reps/hold-time are worth more points.
 * Factor = (bodyWeight / 70) ^ 0.5
 * Examples: 60 kg → 0.93×  |  70 kg → 1.00×  |  90 kg → 1.13×  |  100 kg → 1.20×
 */
function bwFactor(kg) {
  return Math.pow((kg || 70) / 70, 0.5);
}

function calcScore(user, snap) {
  const workoutLog = snap[`${user}_wt_workoutLog`] || {};
  const settings   = snap[`${user}_wt_settings`]   || {};
  const skills     = snap[`${user}_wt_skills`]     || [];

  const bodyStats  = settings.bodyStats || [];
  const bodyWeight = bodyStats.at(-1)?.weight || null;
  const factor     = bwFactor(bodyWeight);

  const logEntries = Object.entries(workoutLog).sort((a, b) => a[0].localeCompare(b[0]));
  const now        = new Date();

  // ── 1. Consistency: active days in last 30 days (max 40 pts) ──────────────
  const cutoff30 = new Date(now); cutoff30.setDate(now.getDate() - 30);
  const recent30 = logEntries.filter(([d, s]) =>
    new Date(d + 'T00:00:00') >= cutoff30 && s.type !== 'rest'
  ).length;
  // Target ~20 active days in 30 days (≈5×/week)
  const consistencyScore = Math.min(40, (recent30 / 20) * 40);

  // ── 2. Total gym volume (max 15 pts) ─────────────────────────────────────
  const totalGym  = logEntries.filter(([, s]) => s.type === 'gym').length;
  const volumeScore = Math.min(15, (totalGym / 60) * 15);

  // ── 3. Skill PRs, weight-normalised (max 35 pts) ─────────────────────────
  let skillRaw = 0;
  for (const skill of skills) {
    if (!skill.logs?.length) continue;
    const pb = Math.max(...skill.logs.map(l => l.value));
    if (skill.unit === 'reps') {
      // Each rep with bw factor; cap per-skill contribution at 12 pts
      skillRaw += Math.min(12, pb * factor * 0.6);
    } else {
      // Seconds: 60 s hold = 6 raw points before bw factor; cap at 12
      skillRaw += Math.min(12, (pb / 60) * 6 * factor);
    }
  }
  const skillScore = Math.min(35, skillRaw);

  // ── 4. Streak bonus (max 10 pts) ─────────────────────────────────────────
  let streak = 0;
  const check = new Date(now);
  while (true) {
    const ds = formatDate(check);
    if (workoutLog[ds] && workoutLog[ds].type !== 'rest') {
      streak++;
      check.setDate(check.getDate() - 1);
    } else break;
  }
  const streakBonus = Math.min(10, streak * 1.5);

  const total = consistencyScore + volumeScore + skillScore + streakBonus;

  return {
    total:       Math.round(total * 10) / 10,
    consistency: Math.round(consistencyScore),
    volume:      Math.round(volumeScore),
    skill:       Math.round(skillScore),
    streak,
    streakBonus: Math.round(streakBonus),
    recent30,
    totalGym,
    bodyWeight,
    factor:      Math.round(factor * 100) / 100,
  };
}

// ── Render ───────────────────────────────────────────────────────────────────
export async function render(container) {
  container.innerHTML = `
    <div class="view-header">
      <h1>Leaderboard</h1>
      <p class="text-muted">Live rankings across all members</p>
    </div>
    <div class="lb-loading">
      <div class="lb-spinner"></div>
      <p class="text-muted">Fetching everyone's data…</p>
    </div>
  `;

  // Fetch all users' keys from Supabase in one query
  const keys = USERS.flatMap(u => [
    `${u}_wt_workoutLog`,
    `${u}_wt_settings`,
    `${u}_wt_skills`,
  ]);
  const snap = await fetchSnapshot(keys);

  // Score & rank
  const ranked = USERS
    .map(u => ({ user: u, meta: USER_META[u], score: calcScore(u, snap) }))
    .sort((a, b) => b.score.total - a.score.total);

  const topScore = ranked[0]?.score.total || 1;

  // ── Podium (top 3) ──
  const podiumHTML = ranked.slice(0, 3).map((r, i) => {
    const wc = weightClass(r.score.bodyWeight);
    return `
      <div class="lb-podium-card lb-podium-${i + 1}">
        <div class="lb-medal">${MEDALS[i]}</div>
        <div class="lb-avatar" style="background:linear-gradient(135deg,${r.meta.color}cc,${r.meta.color})">
          ${r.meta.initials}
        </div>
        <div class="lb-podium-name">${r.meta.display}</div>
        <div class="lb-wc-badge" style="background:${wc.color}22;color:${wc.color}">${wc.label}</div>
        <div class="lb-podium-score">${r.score.total}<span class="lb-pts"> pts</span></div>
      </div>
    `;
  }).join('');

  // ── Full ranking table ──
  const rowsHTML = ranked.map((r, i) => {
    const wc      = weightClass(r.score.bodyWeight);
    const barPct  = Math.round((r.score.total / topScore) * 100);
    const medal   = i < 3 ? MEDALS[i] : `${i + 1}`;
    return `
      <div class="lb-row">
        <div class="lb-rank">${medal}</div>
        <div class="lb-row-avatar" style="background:linear-gradient(135deg,${r.meta.color}cc,${r.meta.color})">
          ${r.meta.initials}
        </div>
        <div class="lb-row-info">
          <div class="lb-row-name">${r.meta.display}
            <span class="lb-wc-badge lb-wc-sm" style="background:${wc.color}22;color:${wc.color}">${wc.label}</span>
          </div>
          <div class="lb-score-bar-wrap">
            <div class="lb-score-bar" style="width:${barPct}%;background:${r.meta.color}"></div>
          </div>
          <div class="lb-breakdown">
            <span title="Consistency (last 30 days)">📅 ${r.score.consistency}</span>
            <span title="Total gym sessions">💪 ${r.score.volume}</span>
            <span title="Skill PRs (weight-adjusted)">⭐ ${r.score.skill}</span>
            <span title="Streak bonus">🔥 ${r.score.streakBonus}</span>
          </div>
        </div>
        <div class="lb-total">${r.score.total}<span class="lb-pts">pts</span></div>
      </div>
    `;
  }).join('');

  // ── Scoring explainer ──
  const bwNote = ranked
    .filter(r => r.score.bodyWeight)
    .map(r => `${r.meta.display} (${r.score.bodyWeight} kg → ${r.score.factor}× BW factor)`)
    .join(' · ') || 'Log your weight in Progress → Body Stats to activate BW scaling.';

  container.innerHTML = `
    <div class="view-header">
      <h1>Leaderboard</h1>
      <p class="text-muted">Live rankings across all members</p>
    </div>

    <div class="lb-podium">${podiumHTML}</div>

    <div class="card" style="margin-top:1.5rem">
      <div class="lb-list">${rowsHTML}</div>
    </div>

    <div class="card lb-explainer" style="margin-top:1rem">
      <h4 style="margin-bottom:.6rem">How scores are calculated</h4>
      <div class="lb-explainer-grid">
        <div class="lb-explainer-item">
          <span>📅</span>
          <div>
            <strong>Consistency</strong> — up to 40 pts<br>
            <span class="text-muted">Active days in the last 30 days (target: 20)</span>
          </div>
        </div>
        <div class="lb-explainer-item">
          <span>💪</span>
          <div>
            <strong>Volume</strong> — up to 15 pts<br>
            <span class="text-muted">Total gym sessions ever logged</span>
          </div>
        </div>
        <div class="lb-explainer-item">
          <span>⭐</span>
          <div>
            <strong>Skill PRs</strong> — up to 35 pts<br>
            <span class="text-muted">Personal bests, adjusted for bodyweight using allometric scaling (heavier athletes earn more per rep/second)</span>
          </div>
        </div>
        <div class="lb-explainer-item">
          <span>🔥</span>
          <div>
            <strong>Streak</strong> — up to 10 pts<br>
            <span class="text-muted">Current active-day streak × 1.5</span>
          </div>
        </div>
      </div>
      <p class="text-muted lb-bw-note">⚖️ ${bwNote}</p>
    </div>
  `;
}
