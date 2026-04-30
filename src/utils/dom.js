// src/utils/dom.js

export function waitFor(selector, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        const obs = new MutationObserver(() => {
            const found = document.querySelector(selector);
            if (found) { obs.disconnect(); resolve(found); }
        });
        obs.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => { obs.disconnect(); reject(new Error(`${selector} not found`)); }, timeout);
    });
}

export function getGifFiber(cardEl) {
    try {
        const fk = Object.keys(cardEl).find(k => k.startsWith('__reactFiber'));
        if (!fk) return null;
        let fiber = cardEl[fk];
        for (let i = 0; i < 40; i++) {
            fiber = fiber && fiber.return;
            if (!fiber) break;
            if (!fiber.memoizedProps) continue;
            
            const props = fiber.memoizedProps;
            for (const key of ['gif', 'item', 'data', 'video']) {
                if (props[key] && Array.isArray(props[key].tags)) return props[key];
            }
            if (Array.isArray(props.tags)) return props;
        }
    } catch (_) { }
    return null;
}
