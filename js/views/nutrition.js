import { DB } from '../db.js';
import { today, formatDate, showModal, showToast, confirm, generateId } from '../utils.js';

export function render(container) {
  _render(container, 'plan');
}

function _render(container, activeTab, logDate) {
  const date = logDate || today();
  container.innerHTML = `
    <div class="view-header">
      <h1>Nutrition</h1>
      <p class="text-muted">Meal planning and food logging</p>
    </div>

    <div class="tabs">
      <button class="tab ${activeTab === 'plan' ? 'tab-active' : ''}" data-tab="plan">Meal Plan</button>
      <button class="tab ${activeTab === 'log' ? 'tab-active' : ''}" data-tab="log">Today's Log</button>
    </div>

    <div id="tab-content"></div>
  `;

  container.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const t = tab.dataset.tab;
      _render(container, t, date);
    });
  });

  if (activeTab === 'plan') {
    renderMealPlanTab(container.querySelector('#tab-content'), container);
  } else {
    renderLogTab(container.querySelector('#tab-content'), container, date);
  }
}

function renderMealPlanTab(tabContent, container) {
  const mealPlan = DB.get('wt_mealPlan') || { targetCalories: 2400, targetProtein: 165, targetCarbs: 230, targetFat: 70, meals: { breakfast: [], lunch: [], dinner: [], snacks: [] } };

  const totalCals = Object.values(mealPlan.meals).flat().reduce((s, f) => s + (f.calories || 0), 0);
  const totalProt = Object.values(mealPlan.meals).flat().reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs = Object.values(mealPlan.meals).flat().reduce((s, f) => s + (f.carbs || 0), 0);
  const totalFat = Object.values(mealPlan.meals).flat().reduce((s, f) => s + (f.fat || 0), 0);

  tabContent.innerHTML = `
    <div class="card" style="margin-top:1rem">
      <h3 style="margin-bottom:1rem">Daily Targets</h3>
      <form id="macro-targets-form" class="form-row">
        <div class="form-group">
          <label>Calories</label>
          <input type="number" name="targetCalories" value="${mealPlan.targetCalories}" class="form-input">
        </div>
        <div class="form-group">
          <label>Protein (g)</label>
          <input type="number" name="targetProtein" value="${mealPlan.targetProtein}" class="form-input">
        </div>
        <div class="form-group">
          <label>Carbs (g)</label>
          <input type="number" name="targetCarbs" value="${mealPlan.targetCarbs}" class="form-input">
        </div>
        <div class="form-group">
          <label>Fat (g)</label>
          <input type="number" name="targetFat" value="${mealPlan.targetFat}" class="form-input">
        </div>
        <div class="form-group" style="align-self:flex-end">
          <button type="submit" class="btn btn-primary">Save Targets</button>
        </div>
      </form>
    </div>

    ${['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => `
      <div class="card" style="margin-top:1rem">
        <div class="section-header">
          <h3>${meal.charAt(0).toUpperCase() + meal.slice(1)}</h3>
          <button class="btn btn-secondary btn-sm btn-add-plan-food" data-meal="${meal}">+ Add Food</button>
        </div>
        <table class="exercises-table">
          <thead>
            <tr><th>Food</th><th>Cal</th><th>Prot</th><th>Carbs</th><th>Fat</th><th></th></tr>
          </thead>
          <tbody>
            ${(mealPlan.meals[meal] || []).map((item, idx) => `
              <tr>
                <td>${item.name}</td>
                <td>${item.calories}</td>
                <td>${item.protein}g</td>
                <td>${item.carbs}g</td>
                <td>${item.fat}g</td>
                <td>
                  <button class="btn btn-icon btn-edit-plan-food" data-meal="${meal}" data-idx="${idx}" title="Edit">✏️</button>
                  <button class="btn btn-icon btn-delete-plan-food" data-meal="${meal}" data-idx="${idx}" title="Delete">🗑️</button>
                </td>
              </tr>
            `).join('')}
            ${(mealPlan.meals[meal] || []).length === 0 ? `<tr><td colspan="6" class="text-muted" style="text-align:center;padding:1rem">No items. Add food to this meal.</td></tr>` : ''}
          </tbody>
        </table>
      </div>
    `).join('')}

    <div class="card" style="margin-top:1rem">
      <h3>Meal Plan Totals</h3>
      <div class="macro-totals">
        <div class="macro-total-item"><span>${totalCals}</span><small>kcal</small></div>
        <div class="macro-total-item"><span>${totalProt}g</span><small>Protein</small></div>
        <div class="macro-total-item"><span>${totalCarbs}g</span><small>Carbs</small></div>
        <div class="macro-total-item"><span>${totalFat}g</span><small>Fat</small></div>
      </div>
    </div>
  `;

  tabContent.querySelector('#macro-targets-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    DB.update('wt_mealPlan', plan => {
      plan.targetCalories = parseInt(data.targetCalories);
      plan.targetProtein = parseInt(data.targetProtein);
      plan.targetCarbs = parseInt(data.targetCarbs);
      plan.targetFat = parseInt(data.targetFat);
      return plan;
    });
    DB.update('wt_settings', s => {
      s.targetCalories = parseInt(data.targetCalories);
      s.targetProtein = parseInt(data.targetProtein);
      return s;
    });
    showToast('Targets saved');
  });

  tabContent.querySelectorAll('.btn-add-plan-food').forEach(btn => {
    btn.addEventListener('click', async () => {
      await addPlanFood(container, btn.dataset.meal);
    });
  });

  tabContent.querySelectorAll('.btn-edit-plan-food').forEach(btn => {
    btn.addEventListener('click', async () => {
      await editPlanFood(container, btn.dataset.meal, parseInt(btn.dataset.idx));
    });
  });

  tabContent.querySelectorAll('.btn-delete-plan-food').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm('Remove this food from the meal plan?');
      if (!ok) return;
      DB.update('wt_mealPlan', plan => {
        plan.meals[btn.dataset.meal].splice(parseInt(btn.dataset.idx), 1);
        return plan;
      });
      showToast('Removed');
      _render(container, 'plan');
    });
  });
}

function renderLogTab(tabContent, container, date) {
  const settings = DB.get('wt_settings') || {};
  const mealPlan = DB.get('wt_mealPlan') || {};
  const foodLog = DB.get('wt_foodLog') || {};
  const entries = foodLog[date] || [];

  const targetCals = mealPlan.targetCalories || settings.targetCalories || 2400;
  const targetProt = mealPlan.targetProtein || settings.targetProtein || 165;
  const targetCarbs = mealPlan.targetCarbs || settings.targetCarbs || 230;
  const targetFat = mealPlan.targetFat || settings.targetFat || 70;

  const totalCals = entries.reduce((s, f) => s + (f.calories || 0), 0);
  const totalProt = entries.reduce((s, f) => s + (f.protein || 0), 0);
  const totalCarbs = entries.reduce((s, f) => s + (f.carbs || 0), 0);
  const totalFat = entries.reduce((s, f) => s + (f.fat || 0), 0);

  const d = new Date(date + 'T00:00:00');
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const pct = (val, target) => Math.min(100, Math.round((val / target) * 100));

  tabContent.innerHTML = `
    <div class="log-date-nav">
      <button class="btn btn-icon" id="log-prev-day">&#8249;</button>
      <span class="log-date-label">${dateLabel}</span>
      <button class="btn btn-icon" id="log-next-day">&#8250;</button>
    </div>

    <div class="card" style="margin-top:1rem">
      <div class="macro-progress-grid">
        ${renderMacroBar('Calories', totalCals, targetCals, 'var(--accent)', 'kcal')}
        ${renderMacroBar('Protein', totalProt, targetProt, 'var(--purple)', 'g')}
        ${renderMacroBar('Carbs', totalCarbs, targetCarbs, 'var(--info)', 'g')}
        ${renderMacroBar('Fat', totalFat, targetFat, 'var(--warning)', 'g')}
      </div>
      <p class="remaining-cals" style="margin-top:.75rem;text-align:center">
        <strong>${Math.max(0, targetCals - totalCals)}</strong> kcal remaining
      </p>
    </div>

    <div class="log-actions" style="margin-top:1rem;display:flex;gap:.75rem;flex-wrap:wrap">
      <button class="btn btn-primary" id="btn-quick-add">Quick Add from Plan</button>
      <button class="btn btn-secondary" id="btn-add-custom">Add Custom Food</button>
    </div>

    ${['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => {
      const mealEntries = entries.filter(e => e.meal === meal);
      return `
        <div class="card" style="margin-top:1rem">
          <div class="section-header">
            <h3>${meal.charAt(0).toUpperCase() + meal.slice(1)}</h3>
            <span class="text-muted">${mealEntries.reduce((s, f) => s + f.calories, 0)} kcal</span>
          </div>
          ${mealEntries.length === 0 ? '<p class="empty-state text-muted">Nothing logged yet</p>' : `
            <ul class="food-log-list">
              ${mealEntries.map((entry, i) => {
                const globalIdx = entries.indexOf(entry);
                return `
                  <li class="food-log-item">
                    <div class="food-log-info">
                      <span class="food-log-name">${entry.name}</span>
                      <span class="food-log-macros text-muted">${entry.calories} kcal &bull; P: ${entry.protein}g &bull; C: ${entry.carbs}g &bull; F: ${entry.fat}g</span>
                    </div>
                    <button class="btn btn-icon btn-delete-food-log" data-date="${date}" data-idx="${globalIdx}" title="Remove">🗑️</button>
                  </li>
                `;
              }).join('')}
            </ul>
          `}
        </div>
      `;
    }).join('')}
  `;

  tabContent.querySelector('#log-prev-day').addEventListener('click', () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    _render(container, 'log', formatDate(d));
  });

  tabContent.querySelector('#log-next-day').addEventListener('click', () => {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    _render(container, 'log', formatDate(d));
  });

  tabContent.querySelector('#btn-quick-add').addEventListener('click', async () => {
    await quickAddFromPlan(container, date);
  });

  tabContent.querySelector('#btn-add-custom').addEventListener('click', async () => {
    await addCustomFood(container, date);
  });

  tabContent.querySelectorAll('.btn-delete-food-log').forEach(btn => {
    btn.addEventListener('click', async () => {
      const ok = await confirm('Remove this food entry?');
      if (!ok) return;
      const idx = parseInt(btn.dataset.idx);
      DB.update('wt_foodLog', log => {
        if (!log) log = {};
        if (log[date]) log[date].splice(idx, 1);
        return log;
      });
      showToast('Entry removed');
      _render(container, 'log', date);
    });
  });
}

function renderMacroBar(label, val, target, color, unit) {
  const pct = Math.min(100, Math.round((val / target) * 100));
  return `
    <div class="macro-progress-item">
      <div class="nutrition-label">
        <span>${label}</span>
        <span>${val}${unit} / ${target}${unit}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" style="width:${pct}%;background:${color}"></div>
      </div>
    </div>
  `;
}

async function addPlanFood(container, meal) {
  const mealPlan = DB.get('wt_mealPlan') || {};
  const formId = 'add-plan-food-form';

  const idx = await showModal(`Add Food to ${meal.charAt(0).toUpperCase() + meal.slice(1)}`, `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Food Name</label>
        <input type="text" name="name" required class="form-input" placeholder="e.g. Chicken Breast (200g)">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Calories</label>
          <input type="number" name="calories" required class="form-input" placeholder="0">
        </div>
        <div class="form-group">
          <label>Protein (g)</label>
          <input type="number" name="protein" required class="form-input" placeholder="0">
        </div>
        <div class="form-group">
          <label>Carbs (g)</label>
          <input type="number" name="carbs" required class="form-input" placeholder="0">
        </div>
        <div class="form-group">
          <label>Fat (g)</label>
          <input type="number" name="fat" required class="form-input" placeholder="0">
        </div>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Add', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));

  DB.update('wt_mealPlan', plan => {
    if (!plan.meals[meal]) plan.meals[meal] = [];
    plan.meals[meal].push({
      name: data.name,
      calories: parseInt(data.calories) || 0,
      protein: parseInt(data.protein) || 0,
      carbs: parseInt(data.carbs) || 0,
      fat: parseInt(data.fat) || 0
    });
    return plan;
  });
  showToast('Food added to meal plan');
  _render(container, 'plan');
}

async function editPlanFood(container, meal, itemIdx) {
  const mealPlan = DB.get('wt_mealPlan') || {};
  const item = mealPlan.meals[meal]?.[itemIdx];
  if (!item) return;

  const formId = 'edit-plan-food-form';
  const idx = await showModal('Edit Food', `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Food Name</label>
        <input type="text" name="name" value="${item.name}" required class="form-input">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Calories</label>
          <input type="number" name="calories" value="${item.calories}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Protein (g)</label>
          <input type="number" name="protein" value="${item.protein}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Carbs (g)</label>
          <input type="number" name="carbs" value="${item.carbs}" required class="form-input">
        </div>
        <div class="form-group">
          <label>Fat (g)</label>
          <input type="number" name="fat" value="${item.fat}" required class="form-input">
        </div>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Save', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));

  DB.update('wt_mealPlan', plan => {
    plan.meals[meal][itemIdx] = {
      name: data.name,
      calories: parseInt(data.calories) || 0,
      protein: parseInt(data.protein) || 0,
      carbs: parseInt(data.carbs) || 0,
      fat: parseInt(data.fat) || 0
    };
    return plan;
  });
  showToast('Updated');
  _render(container, 'plan');
}

async function quickAddFromPlan(container, date) {
  const mealPlan = DB.get('wt_mealPlan') || { meals: {} };

  const rows = ['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => {
    const items = mealPlan.meals[meal] || [];
    if (!items.length) return '';
    return `
      <div style="margin-bottom:1rem">
        <strong>${meal.charAt(0).toUpperCase() + meal.slice(1)}</strong>
        ${items.map((item, i) => `
          <label class="checkbox-row">
            <input type="checkbox" name="item" value="${meal}::${i}">
            <span>${item.name} — ${item.calories} kcal</span>
          </label>
        `).join('')}
      </div>
    `;
  }).join('');

  const formId = 'quick-add-form';
  const idx = await showModal('Quick Add from Meal Plan', `
    <form id="${formId}" class="modal-form">
      ${rows || '<p class="text-muted">No meal plan items configured</p>'}
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Add Selected', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const checked = [...form.querySelectorAll('input[type=checkbox]:checked')].map(c => c.value);

  if (!checked.length) return;

  DB.update('wt_foodLog', log => {
    if (!log) log = {};
    if (!log[date]) log[date] = [];
    checked.forEach(val => {
      const [meal, itemIdx] = val.split('::');
      const item = mealPlan.meals[meal]?.[parseInt(itemIdx)];
      if (item) {
        log[date].push({ ...item, meal, id: generateId() });
      }
    });
    return log;
  });

  showToast(`${checked.length} item(s) added`);
  _render(container, 'log', date);
}

async function addCustomFood(container, date) {
  const formId = 'custom-food-form';
  const idx = await showModal('Add Custom Food', `
    <form id="${formId}" class="modal-form">
      <div class="form-group">
        <label>Food Name</label>
        <input type="text" name="name" required class="form-input" placeholder="e.g. Protein shake">
      </div>
      <div class="form-group">
        <label>Meal</label>
        <select name="meal" class="form-input">
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snacks">Snacks</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Calories</label>
          <input type="number" name="calories" required class="form-input" placeholder="0">
        </div>
        <div class="form-group">
          <label>Protein (g)</label>
          <input type="number" name="protein" required class="form-input" placeholder="0">
        </div>
        <div class="form-group">
          <label>Carbs (g)</label>
          <input type="number" name="carbs" required class="form-input" placeholder="0">
        </div>
        <div class="form-group">
          <label>Fat (g)</label>
          <input type="number" name="fat" required class="form-input" placeholder="0">
        </div>
      </div>
    </form>
  `, [{ label: 'Cancel', type: 'secondary' }, { label: 'Add', type: 'primary' }]);

  if (idx !== 1) return;

  const form = document.getElementById(formId);
  const data = Object.fromEntries(new FormData(form));

  DB.update('wt_foodLog', log => {
    if (!log) log = {};
    if (!log[date]) log[date] = [];
    log[date].push({
      id: generateId(),
      name: data.name,
      meal: data.meal,
      calories: parseInt(data.calories) || 0,
      protein: parseInt(data.protein) || 0,
      carbs: parseInt(data.carbs) || 0,
      fat: parseInt(data.fat) || 0
    });
    return log;
  });
  showToast('Food logged');
  _render(container, 'log', date);
}
