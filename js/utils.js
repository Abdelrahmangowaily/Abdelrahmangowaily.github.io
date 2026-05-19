export function formatDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function today() {
  return formatDate(new Date());
}

export function getDayName(dateStr) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const d = new Date(dateStr + 'T00:00:00');
  return days[d.getDay()];
}

export function showToast(message, type = 'success') {
  const container = document.getElementById('toasts');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  setTimeout(() => {
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3000);
}

export function showModal(title, bodyHTML, buttons = []) {
  return new Promise((resolve) => {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) { resolve(-1); return; }

    const btns = buttons.length
      ? buttons
      : [{ label: 'Close', type: 'secondary' }];

    overlay.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div class="modal-header">
          <h2 id="modal-title">${title}</h2>
          <button class="modal-close btn-icon" aria-label="Close">&times;</button>
        </div>
        <div class="modal-body">${bodyHTML}</div>
        <div class="modal-footer">
          ${btns.map((b, i) => `<button class="btn btn-${b.type || 'secondary'}" data-idx="${i}">${b.label}</button>`).join('')}
        </div>
      </div>
    `;

    overlay.classList.add('active');
    document.body.classList.add('modal-open');

    const cleanup = (idx) => {
      overlay.classList.remove('active');
      document.body.classList.remove('modal-open');
      resolve(idx);
    };

    overlay.querySelector('.modal-close').addEventListener('click', () => cleanup(-1));

    overlay.querySelectorAll('.modal-footer .btn').forEach(btn => {
      btn.addEventListener('click', () => cleanup(parseInt(btn.dataset.idx)));
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(-1);
    }, { once: true });
  });
}

export function hideModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) {
    overlay.classList.remove('active');
    document.body.classList.remove('modal-open');
  }
}

export function confirm(message) {
  return showModal('Confirm', `<p>${message}</p>`, [
    { label: 'Cancel', type: 'secondary' },
    { label: 'Yes', type: 'danger' }
  ]).then(idx => idx === 1);
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
