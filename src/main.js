// ==UserScript==
// @name         RedGIFs Tag & User Filter
// @namespace    https://www.redgifs.com/
// @version      1.0.0
// @description  Filter GIF cards by tag or username. Hover any card to quick-add. Wildcards, case-insensitive, persistent.
// @author       spookspookspookspook
// @match        https://www.redgifs.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

import { initStorage } from './state.js';
import { buildPanel } from './ui/panel.js';
import { applyFeedFilters } from './filters/feed.js';
import { applyExploreFilters, checkAndAttachExploreObserver } from './filters/explore.js';
import { injectStrips } from './ui/quickAdd.js';

function applyAllFilters() {
  applyFeedFilters();
  applyExploreFilters();
}

const globalObserver = new MutationObserver(mutations => {
  const hasNew = mutations.some(m => m.addedNodes.length > 0);
  if (hasNew) {
    applyAllFilters();
    injectStrips();
    checkAndAttachExploreObserver();
  }
});

function init() {
  initStorage();
  buildPanel();

  setTimeout(() => {
    applyAllFilters();
    injectStrips();
    checkAndAttachExploreObserver();
  }, 1500);

  globalObserver.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

GM_addStyle(`
/* must use !important to beat the site's own
   .GifPreview { display: block !important } declaration.
   Userscript styles load after page styles so same-specificity
   !important from us wins via source order.                      */
.GifPreview.rgf-filtered {
  display: none !important;
}

/* ── Filter panel ── */
#rgf-panel {
  position: fixed;
  top: 56px;
  right: 14px;
  z-index: 99999;
  background: #161616;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 12px 16px 12px;
  width: 315px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  color: #e0e0e0;
  box-shadow: 0 8px 32px rgba(0,0,0,0.7);
}
#rgf-panel.rgf-collapsed { width: auto; padding: 8px 14px; }
#rgf-panel.rgf-collapsed .rgf-body { display: none; }

#rgf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-weight: 700;
  font-size: 13px;
  color: #ff4455;
  letter-spacing: 0.02em;
  margin-bottom: 2px;
}
#rgf-panel.rgf-collapsed #rgf-header { margin-bottom: 0; }

#rgf-collapse-btn {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
#rgf-collapse-btn:hover { color: #aaa; }

.rgf-section-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 12px 0 5px;
}
.rgf-section-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #555;
  font-weight: 600;
  margin: 0;
}
.rgf-section-count {
  color: #ff4455;
  margin-left: 4px;
  font-size: 9px;
}
.rgf-clear-btn {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  font-size: 9px;
  padding: 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: color 0.15s;
}
.rgf-clear-btn:hover { color: #ff4455; }
.rgf-input-row { display: flex; gap: 6px; }
.rgf-input-row input {
  flex: 1;
  background: #222;
  border: 1px solid #3a3a3a;
  border-radius: 7px;
  padding: 6px 9px;
  color: #eee;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}
.rgf-input-row input:focus { border-color: #ff4455; }
.rgf-input-row input::placeholder { color: #444; }
.rgf-add-btn {
  background: #ff4455;
  border: none;
  border-radius: 7px;
  color: #fff;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
  padding: 3px 10px 5px;
  font-weight: bold;
  transition: background 0.15s;
}
.rgf-add-btn:hover { background: #ff6677; }

.rgf-pill-list-wrap {
  position: relative;
  margin-top: 7px;
}
.rgf-pill-list-wrap::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 6px;
  height: 28px;
  background: linear-gradient(to bottom, transparent, #161616);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
.rgf-pill-list-wrap.rgf-overflowing::after { opacity: 1; }
.rgf-pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  max-height: 100px;
  overflow-y: auto;
  min-height: 4px;
  padding-bottom: 2px;
  scrollbar-width: thin;
  scrollbar-color: #3a3a3a #1e1e1e;
}
.rgf-pill-list::-webkit-scrollbar { width: 5px; }
.rgf-pill-list::-webkit-scrollbar-track { background: #1e1e1e; border-radius: 3px; }
.rgf-pill-list::-webkit-scrollbar-thumb { background: #3a3a3a; border-radius: 3px; }
.rgf-pill-list::-webkit-scrollbar-thumb:hover { background: #555; }
.rgf-panel-pill {
  display: flex;
  align-items: center;
  gap: 3px;
  background: #252525;
  border: 1px solid #3a3a3a;
  border-radius: 20px;
  padding: 3px 7px 3px 10px;
  font-size: 12px;
  color: #bbb;
}
.rgf-panel-pill-x {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  padding: 0 0 0 2px;
  transition: color 0.15s;
}
.rgf-panel-pill-x:hover { color: #ff4455; }

.rgf-hint {
  font-size: 10px;
  color: #444;
  margin-top: 10px;
  line-height: 1.7;
}
.rgf-hint b { color: #777; }
.rgf-hint i { color: #666; font-style: normal; }

.rgf-apply-btn {
  margin-top: 12px;
  width: 100%;
  background: #ff4455;
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  font-size: 13px;
  font-weight: 700;
  padding: 8px;
  transition: background 0.15s;
}
.rgf-apply-btn:hover { background: #ff6677; }
.rgf-count {
  font-size: 11px;
  color: #444;
  margin-top: 7px;
  text-align: right;
}

/* ── Quick-add hover strip ── */
.GifPreview-InfoAndSidebar { position: relative; }
.rgf-quick-strip {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 46px;
  z-index: 20;
  display: none;
  flex-wrap: wrap;
  align-items: center;
  gap: 5px;
  padding: 7px 10px;
  background: linear-gradient(to top, rgba(0,0,0,0.92), rgba(0,0,0,0.65));
  border-top: 1px solid rgba(255,255,255,0.07);
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
  pointer-events: auto;
}
.GifPreview:hover .rgf-quick-strip { display: flex; }

.rgf-strip-label {
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.09em;
  color: #777;
  font-weight: 700;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  white-space: nowrap;
  margin-right: 2px;
}
.rgf-strip-pill {
  border-radius: 20px;
  cursor: pointer;
  font-size: 11px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  padding: 3px 9px;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s, color 0.15s, opacity 0.15s;
  line-height: 1.4;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.rgf-tag-pill {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #ddd;
}
.rgf-tag-pill:hover:not(:disabled) {
  background: rgba(255,68,85,0.35);
  border-color: #ff4455;
  color: #fff;
}
.rgf-user-pill {
  background: rgba(50,120,220,0.2);
  border: 1px solid rgba(100,180,255,0.35);
  color: #aad4ff;
}
.rgf-user-pill:hover:not(:disabled) {
  background: rgba(50,120,220,0.4);
  border-color: #5599ff;
  color: #fff;
}
.rgf-strip-pill.rgf-pill-active { opacity: 0.5; cursor: default; }
.rgf-tag-pill.rgf-pill-active  { background: rgba(255,68,85,0.2);  border-color: #ff4455; color: #ff8899; }
.rgf-user-pill.rgf-pill-active { background: rgba(50,120,220,0.2); border-color: #4499ff; color: #88bbff; }

/* ── Toast ── */
#rgf-toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%) translateY(10px);
  background: #1c1c1c;
  border: 1px solid #3a3a3a;
  border-radius: 24px;
  color: #eee;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 13px;
  padding: 9px 20px;
  z-index: 999999;
  opacity: 0;
  transition: opacity 0.25s ease, transform 0.25s ease;
  pointer-events: none;
  white-space: nowrap;
  box-shadow: 0 4px 20px rgba(0,0,0,0.6);
}
#rgf-toast.rgf-toast-show { opacity: 1; transform: translateX(-50%) translateY(0); }
`);