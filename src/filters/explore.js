// src/filters/explore.js

import { matchesAny } from '../utils/matcher.js';
import { getTagFilters, getUserFilters } from '../state.js';
import { getGifFiber } from '../utils/dom.js';

function parseAlt(alt) {
    if (!alt) return { tags: [], creator: '' };
    const creatorMatch = alt.match(/uploaded by\s+(\S+)\s+on/i);
    const creator = creatorMatch ? creatorMatch[1].toLowerCase() : '';
    const tagsPart = alt.split(/\s+porn\s+/i)[0] || '';
    const tags = tagsPart.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    return { tags, creator };
}

export function applyExploreFilters() {
    const items = document.querySelectorAll('.gifList .tileItem');
    if (!items.length) return;
    
    const tagFilters = getTagFilters();
    const userFilters = getUserFilters();

    items.forEach(item => {
        let tags = [];
        let creator = '';

        // 1. Try getting data from React Fiber
        const fiberData = getGifFiber(item);
        if (fiberData) {
            tags = fiberData.tags || [];
            creator = fiberData.userName || '';
        } else {
            // 2. Fallback to DOM alt parsing
            const img = item.querySelector('img.thumbnail');
            const alt = img ? img.getAttribute('alt') || '' : '';
            if (alt) {
                const parsed = parseAlt(alt);
                tags = parsed.tags;
                creator = parsed.creator;
            }
        }

        // If we found absolutely nothing, it might be a hollow loading placeholder
        if (!tags.length && !creator) { 
            item.style.display = ''; 
            return; 
        }

        const hasUserMatch = userFilters.length > 0 && creator && matchesAny(creator, userFilters);
        const hasTagMatch = tagFilters.length > 0 && tags.some(tag => matchesAny(tag, tagFilters));
        
        item.style.display = (hasUserMatch || hasTagMatch) ? 'none' : '';
    });
}

// Global observer for explore page
let exploreObserver = null;
let currentGifList = null;

export function checkAndAttachExploreObserver() {
    const gifList = document.querySelector('.gifList');
    if (gifList && gifList !== currentGifList) {
        if (exploreObserver) exploreObserver.disconnect();
        
        let debounce;
        exploreObserver = new MutationObserver(() => {
            clearTimeout(debounce);
            debounce = setTimeout(applyExploreFilters, 120);
        });
        exploreObserver.observe(gifList, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['alt', 'src'],
        });
        currentGifList = gifList;
    }
}
