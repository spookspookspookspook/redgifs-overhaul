// src/filters/feed.js

import { getGifFiber } from '../utils/dom.js';
import { matchesAny } from '../utils/matcher.js';
import { getTagFilters, getUserFilters } from '../state.js';

export function getCardInfo(cardEl) {
    const gif = getGifFiber(cardEl);
    const userName = gif ? (gif.userName || '') : '';
    const userNameEl = cardEl.querySelector('.userName');
    const displayName = userNameEl ? userNameEl.textContent.trim() : '';
    let tags = gif && Array.isArray(gif.tags) ? gif.tags : [];
    if (!tags.length) {
        const descEl = cardEl.querySelector('.descriptionText');
        if (descEl) tags = descEl.textContent.split('#').slice(1).map(t => t.trim()).filter(Boolean);
    }
    return { userName, displayName, tags };
}

function shouldHide(cardEl) {
    const tagFilters = getTagFilters();
    const userFilters = getUserFilters();
    if (!tagFilters.length && !userFilters.length) return false;
    const { userName, displayName, tags } = getCardInfo(cardEl);

    const hasUserMatch = userFilters.length > 0 && 
        (matchesAny(userName, userFilters) || matchesAny(displayName, userFilters));
    
    const hasTagMatch = tagFilters.length > 0 && 
        tags.some(tag => matchesAny(tag, tagFilters));

    return hasUserMatch || hasTagMatch;
}

const cardGuardians = new WeakMap();

function hideCard(cardEl) {
    cardEl.classList.add('rgf-filtered');
    cardEl.dataset.rgfHidden = '1';
    if (cardGuardians.has(cardEl)) return;
    const guardian = new MutationObserver(() => {
        if (!cardEl.classList.contains('rgf-filtered')) {
            cardEl.classList.add('rgf-filtered');
        }
    });
    guardian.observe(cardEl, { attributes: true, attributeFilter: ['class'] });
    cardGuardians.set(cardEl, guardian);
}

function showCard(cardEl) {
    if (cardGuardians.has(cardEl)) {
        cardGuardians.get(cardEl).disconnect();
        cardGuardians.delete(cardEl);
    }
    cardEl.classList.remove('rgf-filtered');
    delete cardEl.dataset.rgfHidden;
}

export function applyFeedFilters() {
    document.querySelectorAll('.GifPreview').forEach(card => {
        if (shouldHide(card)) {
            hideCard(card);
        } else if (card.dataset.rgfHidden === '1') {
            showCard(card);
        }
    });
}
