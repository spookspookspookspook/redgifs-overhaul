// src/ui/quickAdd.js

import { getCardInfo } from '../filters/feed.js';
import { matchesAny } from '../utils/matcher.js';
import { getTagFilters, getUserFilters, addUserFilter, addTagFilter } from '../state.js';
import { showToast } from './toast.js';

function makePill(text, cls, onClick) {
    const btn = document.createElement('button');
    btn.className = cls;
    btn.textContent = text;
    btn.title = 'Click to filter';
    btn.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); onClick(); });
    return btn;
}

export function buildStrip(cardEl, infoBar) {
    if (infoBar.querySelector('.rgf-quick-strip')) return;
    const { userName, displayName, tags } = getCardInfo(cardEl);
    if (!userName && !displayName && !tags.length) return;

    const strip = document.createElement('div');
    strip.className = 'rgf-quick-strip';

    const label = document.createElement('span');
    label.className = 'rgf-strip-label';
    label.textContent = 'Filter:';
    strip.appendChild(label);

    const userFilters = getUserFilters();
    const tagFilters = getTagFilters();

    const filterValue = userName || displayName;
    const sameOrNoReal = !userName || displayName.toLowerCase() === userName.toLowerCase();
    let pillLabel;
    if (!displayName) {
        pillLabel = '@' + userName;
    } else if (sameOrNoReal) {
        pillLabel = '@' + displayName;
    } else {
        pillLabel = `@${displayName} (${userName})`;
    }

    if (filterValue) {
        const pill = makePill(pillLabel, 'rgf-strip-pill rgf-user-pill', () => {
            if (addUserFilter(filterValue)) {
                showToast('🚫 Filtering: ' + filterValue);
            } else {
                showToast('Already filtering: ' + filterValue);
            }
            pill.classList.add('rgf-pill-active');
            pill.disabled = true;
        });
        const already = userFilters.some(f => matchesAny(userName, [f]) || matchesAny(displayName, [f]));
        if (already) { pill.classList.add('rgf-pill-active'); pill.disabled = true; }
        strip.appendChild(pill);
    }

    tags.forEach(tag => {
        const pill = makePill('#' + tag, 'rgf-strip-pill rgf-tag-pill', () => {
            if (addTagFilter(tag)) {
                showToast('🚫 Filtering tag: #' + tag);
            } else {
                showToast('Already filtering: #' + tag);
            }
            pill.classList.add('rgf-pill-active');
            pill.disabled = true;
        });
        if (tagFilters.some(f => matchesAny(tag, [f]))) { pill.classList.add('rgf-pill-active'); pill.disabled = true; }
        strip.appendChild(pill);
    });

    infoBar.appendChild(strip);
}

export function syncStripStates() {
    const userFilters = getUserFilters();
    const tagFilters = getTagFilters();

    document.querySelectorAll('.rgf-strip-pill.rgf-user-pill').forEach(pill => {
        const card = pill.closest('.GifPreview');
        if (!card) return;
        const { userName, displayName } = getCardInfo(card);
        const active = userFilters.some(f => matchesAny(userName, [f]) || matchesAny(displayName, [f]));
        pill.classList.toggle('rgf-pill-active', active);
        pill.disabled = active;
    });
    document.querySelectorAll('.rgf-strip-pill.rgf-tag-pill').forEach(pill => {
        const tag = pill.textContent.replace(/^#/, '');
        const active = tagFilters.some(f => matchesAny(tag, [f]));
        pill.classList.toggle('rgf-pill-active', active);
        pill.disabled = active;
    });
}

export function injectStrips() {
    document.querySelectorAll('.GifPreview-InfoAndSidebar').forEach(infoBar => {
        const card = infoBar.closest('.GifPreview');
        if (card) buildStrip(card, infoBar);
    });
}
