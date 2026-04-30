// src/ui/toast.js

export function showToast(msg) {
    const old = document.getElementById('rgf-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.id = 'rgf-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add('rgf-toast-show')));
    setTimeout(() => { t.classList.remove('rgf-toast-show'); setTimeout(() => t.remove(), 400); }, 2200);
}
