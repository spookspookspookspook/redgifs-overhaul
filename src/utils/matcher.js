// src/utils/matcher.js

export function patternToRegex(pattern) {
    const p = pattern.trim().toLowerCase();
    if (!p) return null;
    const sw = p.endsWith('*');
    const ew = p.startsWith('*');
    const core = p.replace(/^\*+/, '').replace(/\*+$/, '');
    const esc = core.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    let src;
    if (sw && ew) src = esc;
    else if (sw) src = '^' + esc;
    else if (ew) src = esc + '$';
    else src = '^' + esc + '$';
    return new RegExp(src, 'i');
}

export function matchesAny(text, patterns) {
    const lower = (text || '').toLowerCase().trim();
    return patterns.some(p => { 
        const rx = patternToRegex(p); 
        return rx && rx.test(lower); 
    });
}
