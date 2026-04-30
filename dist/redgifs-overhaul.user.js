// ==UserScript==
// @name         Redgifs Overhaul
// @namespace    npm/vite-plugin-monkey
// @version      1.0.0
// @author       spookspookspookspook
// @description  Massively overhaul the redgifs.com experience
// @license      MIT
// @match        *://*.redgifs.com/*
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

(function () {
  'use strict';

  let tagFilters = [];
  let userFilters = [];
  const subscribers = new Set();
  function initStorage() {
    tagFilters = GM_getValue("rgf_tags", []);
    userFilters = GM_getValue("rgf_users", []);
  }
  function saveStorage() {
    GM_setValue("rgf_tags", tagFilters);
    GM_setValue("rgf_users", userFilters);
    notifySubscribers();
  }
  function getTagFilters() {
    return tagFilters;
  }
  function getUserFilters() {
    return userFilters;
  }
  function addTagFilter(tag) {
    if (!tagFilters.includes(tag)) {
      tagFilters.push(tag);
      saveStorage();
      return true;
    }
    return false;
  }
  function removeTagFilter(index) {
    tagFilters.splice(index, 1);
    saveStorage();
  }
  function addUserFilter(user) {
    if (!userFilters.includes(user)) {
      userFilters.push(user);
      saveStorage();
      return true;
    }
    return false;
  }
  function removeUserFilter(index) {
    userFilters.splice(index, 1);
    saveStorage();
  }
  function subscribe(callback) {
    subscribers.add(callback);
  }
  function notifySubscribers() {
    subscribers.forEach((cb) => cb());
  }
  function getGifFiber(cardEl) {
    try {
      const fk = Object.keys(cardEl).find((k) => k.startsWith("__reactFiber"));
      if (!fk) return null;
      let fiber = cardEl[fk];
      for (let i = 0; i < 40; i++) {
        fiber = fiber && fiber.return;
        if (!fiber) break;
        if (!fiber.memoizedProps) continue;
        const props = fiber.memoizedProps;
        for (const key of ["gif", "item", "data", "video"]) {
          if (props[key] && Array.isArray(props[key].tags)) return props[key];
        }
        if (Array.isArray(props.tags)) return props;
      }
    } catch (_) {
    }
    return null;
  }
  function patternToRegex(pattern) {
    const p = pattern.trim().toLowerCase();
    if (!p) return null;
    const sw = p.endsWith("*");
    const ew = p.startsWith("*");
    const core = p.replace(/^\*+/, "").replace(/\*+$/, "");
    const esc = core.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
    let src;
    if (sw && ew) src = esc;
    else if (sw) src = "^" + esc;
    else if (ew) src = esc + "$";
    else src = "^" + esc + "$";
    return new RegExp(src, "i");
  }
  function matchesAny(text, patterns) {
    const lower = (text || "").toLowerCase().trim();
    return patterns.some((p) => {
      const rx = patternToRegex(p);
      return rx && rx.test(lower);
    });
  }
  function getCardInfo(cardEl) {
    const gif = getGifFiber(cardEl);
    const userName = gif ? gif.userName || "" : "";
    const userNameEl = cardEl.querySelector(".userName");
    const displayName = userNameEl ? userNameEl.textContent.trim() : "";
    let tags = gif && Array.isArray(gif.tags) ? gif.tags : [];
    if (!tags.length) {
      const descEl = cardEl.querySelector(".descriptionText");
      if (descEl) tags = descEl.textContent.split("#").slice(1).map((t) => t.trim()).filter(Boolean);
    }
    return { userName, displayName, tags };
  }
  function shouldHide(cardEl) {
    const tagFilters2 = getTagFilters();
    const userFilters2 = getUserFilters();
    if (!tagFilters2.length && !userFilters2.length) return false;
    const { userName, displayName, tags } = getCardInfo(cardEl);
    const hasUserMatch = userFilters2.length > 0 && (matchesAny(userName, userFilters2) || matchesAny(displayName, userFilters2));
    const hasTagMatch = tagFilters2.length > 0 && tags.some((tag) => matchesAny(tag, tagFilters2));
    return hasUserMatch || hasTagMatch;
  }
  const cardGuardians = new WeakMap();
  function hideCard(cardEl) {
    cardEl.classList.add("rgf-filtered");
    cardEl.dataset.rgfHidden = "1";
    if (cardGuardians.has(cardEl)) return;
    const guardian = new MutationObserver(() => {
      if (!cardEl.classList.contains("rgf-filtered")) {
        cardEl.classList.add("rgf-filtered");
      }
    });
    guardian.observe(cardEl, { attributes: true, attributeFilter: ["class"] });
    cardGuardians.set(cardEl, guardian);
  }
  function showCard(cardEl) {
    if (cardGuardians.has(cardEl)) {
      cardGuardians.get(cardEl).disconnect();
      cardGuardians.delete(cardEl);
    }
    cardEl.classList.remove("rgf-filtered");
    delete cardEl.dataset.rgfHidden;
  }
  function applyFeedFilters() {
    document.querySelectorAll(".GifPreview").forEach((card) => {
      if (shouldHide(card)) {
        hideCard(card);
      } else if (card.dataset.rgfHidden === "1") {
        showCard(card);
      }
    });
  }
  function parseAlt(alt) {
    if (!alt) return { tags: [], creator: "" };
    const creatorMatch = alt.match(/uploaded by\s+(\S+)\s+on/i);
    const creator = creatorMatch ? creatorMatch[1].toLowerCase() : "";
    const tagsPart = alt.split(/\s+porn\s+/i)[0] || "";
    const tags = tagsPart.split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
    return { tags, creator };
  }
  function applyExploreFilters() {
    const items = document.querySelectorAll(".gifList .tileItem");
    if (!items.length) return;
    const tagFilters2 = getTagFilters();
    const userFilters2 = getUserFilters();
    items.forEach((item) => {
      let tags = [];
      let creator = "";
      const fiberData = getGifFiber(item);
      if (fiberData) {
        tags = fiberData.tags || [];
        creator = fiberData.userName || "";
      } else {
        const img = item.querySelector("img.thumbnail");
        const alt = img ? img.getAttribute("alt") || "" : "";
        if (alt) {
          const parsed = parseAlt(alt);
          tags = parsed.tags;
          creator = parsed.creator;
        }
      }
      if (!tags.length && !creator) {
        item.style.display = "";
        return;
      }
      const hasUserMatch = userFilters2.length > 0 && creator && matchesAny(creator, userFilters2);
      const hasTagMatch = tagFilters2.length > 0 && tags.some((tag) => matchesAny(tag, tagFilters2));
      item.style.display = hasUserMatch || hasTagMatch ? "none" : "";
    });
  }
  let exploreObserver = null;
  let currentGifList = null;
  function checkAndAttachExploreObserver() {
    const gifList = document.querySelector(".gifList");
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
        attributeFilter: ["alt", "src"]
      });
      currentGifList = gifList;
    }
  }
  function showToast(msg) {
    const old = document.getElementById("rgf-toast");
    if (old) old.remove();
    const t = document.createElement("div");
    t.id = "rgf-toast";
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(() => requestAnimationFrame(() => t.classList.add("rgf-toast-show")));
    setTimeout(() => {
      t.classList.remove("rgf-toast-show");
      setTimeout(() => t.remove(), 400);
    }, 2200);
  }
  function makePill(text, cls, onClick) {
    const btn = document.createElement("button");
    btn.className = cls;
    btn.textContent = text;
    btn.title = "Click to filter";
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      onClick();
    });
    return btn;
  }
  function buildStrip(cardEl, infoBar) {
    if (infoBar.querySelector(".rgf-quick-strip")) return;
    const { userName, displayName, tags } = getCardInfo(cardEl);
    if (!userName && !displayName && !tags.length) return;
    const strip = document.createElement("div");
    strip.className = "rgf-quick-strip";
    const label = document.createElement("span");
    label.className = "rgf-strip-label";
    label.textContent = "Filter:";
    strip.appendChild(label);
    const userFilters2 = getUserFilters();
    const tagFilters2 = getTagFilters();
    const filterValue = userName || displayName;
    const sameOrNoReal = !userName || displayName.toLowerCase() === userName.toLowerCase();
    const pillLabel = displayName ? sameOrNoReal ? "@" + displayName : "@" + displayName + " (" + userName + ")" : "@" + userName;
    if (filterValue) {
      const pill = makePill(pillLabel, "rgf-strip-pill rgf-user-pill", () => {
        if (addUserFilter(filterValue)) {
          showToast("🚫 Filtering: " + filterValue);
        } else {
          showToast("Already filtering: " + filterValue);
        }
        pill.classList.add("rgf-pill-active");
        pill.disabled = true;
      });
      const already = userFilters2.some((f) => matchesAny(userName, [f]) || matchesAny(displayName, [f]));
      if (already) {
        pill.classList.add("rgf-pill-active");
        pill.disabled = true;
      }
      strip.appendChild(pill);
    }
    tags.forEach((tag) => {
      const pill = makePill("#" + tag, "rgf-strip-pill rgf-tag-pill", () => {
        if (addTagFilter(tag)) {
          showToast("🚫 Filtering tag: #" + tag);
        } else {
          showToast("Already filtering: #" + tag);
        }
        pill.classList.add("rgf-pill-active");
        pill.disabled = true;
      });
      if (tagFilters2.some((f) => matchesAny(tag, [f]))) {
        pill.classList.add("rgf-pill-active");
        pill.disabled = true;
      }
      strip.appendChild(pill);
    });
    infoBar.appendChild(strip);
  }
  function syncStripStates() {
    const userFilters2 = getUserFilters();
    const tagFilters2 = getTagFilters();
    document.querySelectorAll(".rgf-strip-pill.rgf-user-pill").forEach((pill) => {
      const card = pill.closest(".GifPreview");
      if (!card) return;
      const { userName, displayName } = getCardInfo(card);
      const active = userFilters2.some((f) => matchesAny(userName, [f]) || matchesAny(displayName, [f]));
      pill.classList.toggle("rgf-pill-active", active);
      pill.disabled = active;
    });
    document.querySelectorAll(".rgf-strip-pill.rgf-tag-pill").forEach((pill) => {
      const tag = pill.textContent.replace(/^#/, "");
      const active = tagFilters2.some((f) => matchesAny(tag, [f]));
      pill.classList.toggle("rgf-pill-active", active);
      pill.disabled = active;
    });
  }
  function injectStrips() {
    document.querySelectorAll(".GifPreview-InfoAndSidebar").forEach((infoBar) => {
      const card = infoBar.closest(".GifPreview");
      if (card) buildStrip(card, infoBar);
    });
  }
  let refreshPanel = () => {
  };
  function buildPanel() {
    const panel = document.createElement("div");
    panel.id = "rgf-panel";
    panel.className = "rgf-collapsed";
    panel.innerHTML = `
      <div id="rgf-header">
        <span>🚫 RedGIFs Filter</span>
        <button id="rgf-collapse-btn" title="Expand">▼</button>
      </div>
      <div class="rgf-body">
        <div class="rgf-section-row">
          <div class="rgf-section-label">Tag Filters <span class="rgf-section-count" id="rgf-tag-count"></span></div>
          <button class="rgf-clear-btn" id="rgf-tag-clear" style="display:none">clear all</button>
        </div>
        <div class="rgf-input-row">
          <input id="rgf-tag-input" type="text" placeholder="amateur  /  *feet*  /  solo*" />
          <button class="rgf-add-btn" id="rgf-tag-add">+</button>
        </div>
        <div class="rgf-pill-list-wrap" id="rgf-tag-pills-wrap">
          <div class="rgf-pill-list" id="rgf-tag-pills"></div>
        </div>

        <div class="rgf-section-row">
          <div class="rgf-section-label">Username Filters <span class="rgf-section-count" id="rgf-user-count"></span></div>
          <button class="rgf-clear-btn" id="rgf-user-clear" style="display:none">clear all</button>
        </div>
        <div class="rgf-input-row">
          <input id="rgf-user-input" type="text" placeholder="real username or display name" />
          <button class="rgf-add-btn" id="rgf-user-add">+</button>
        </div>
        <div class="rgf-pill-list-wrap" id="rgf-user-pills-wrap">
          <div class="rgf-pill-list" id="rgf-user-pills"></div>
        </div>

        <div class="rgf-hint">
          <b>*word*</b> contains &nbsp;·&nbsp; <b>word*</b> starts &nbsp;·&nbsp;
          <b>*word</b> ends &nbsp;·&nbsp; <b>word</b> exact<br>
          Username matches both real username <i>and</i> display name.<br>
          Hover any video to quick-add tags or user.
        </div>
        <button class="rgf-apply-btn" id="rgf-apply">Apply Filters Now</button>
        <div class="rgf-count" id="rgf-count"></div>
      </div>
    `;
    document.body.appendChild(panel);
    let collapsed = true;
    const colBtn = panel.querySelector("#rgf-collapse-btn");
    panel.querySelector("#rgf-header").addEventListener("click", () => {
      collapsed = !collapsed;
      panel.classList.toggle("rgf-collapsed", collapsed);
      colBtn.textContent = collapsed ? "▼" : "▲";
    });
    function renderPills(id, arr, onRemove, countId, wrapId, clearId) {
      const container = panel.querySelector("#" + id);
      container.innerHTML = "";
      arr.forEach((f, i) => {
        const pill = document.createElement("span");
        pill.className = "rgf-panel-pill";
        pill.appendChild(document.createTextNode(f));
        const x = document.createElement("button");
        x.className = "rgf-panel-pill-x";
        x.textContent = "×";
        x.addEventListener("click", () => onRemove(i));
        pill.appendChild(x);
        container.appendChild(pill);
      });
      const countEl = panel.querySelector("#" + countId);
      if (countEl) countEl.textContent = arr.length ? `(${arr.length})` : "";
      const clearEl = panel.querySelector("#" + clearId);
      if (clearEl) clearEl.style.display = arr.length ? "" : "none";
      const wrap = panel.querySelector("#" + wrapId);
      if (wrap) {
        requestAnimationFrame(() => {
          wrap.classList.toggle("rgf-overflowing", container.scrollHeight > container.clientHeight);
        });
      }
    }
    function updateCount() {
      const hiddenFeed = document.querySelectorAll(".GifPreview.rgf-filtered").length;
      const totalFeed = document.querySelectorAll(".GifPreview").length;
      let countText = "";
      if (totalFeed > 0) {
        countText = `Hiding ${hiddenFeed} of ${totalFeed} feed cards`;
      }
      const exploreItems = document.querySelectorAll(".gifList .tileItem");
      if (exploreItems.length > 0) {
        const hiddenExplore = Array.from(exploreItems).filter((i) => i.style.display === "none").length;
        if (countText) countText += " | ";
        countText += `Hiding ${hiddenExplore} of ${exploreItems.length} explore tiles`;
      }
      panel.querySelector("#rgf-count").textContent = countText;
    }
    refreshPanel = () => {
      const tagFilters2 = getTagFilters();
      const userFilters2 = getUserFilters();
      renderPills("rgf-tag-pills", tagFilters2, (i) => removeTagFilter(i), "rgf-tag-count", "rgf-tag-pills-wrap", "rgf-tag-clear");
      renderPills("rgf-user-pills", userFilters2, (i) => removeUserFilter(i), "rgf-user-count", "rgf-user-pills-wrap", "rgf-user-clear");
      updateCount();
    };
    subscribe(() => {
      refreshPanel();
      applyFeedFilters();
      applyExploreFilters();
      syncStripStates();
    });
    function addFilterFromInput(inputId, addFn) {
      const input = panel.querySelector("#" + inputId);
      const val = input.value.trim();
      if (val) {
        addFn(val);
        input.value = "";
      }
    }
    panel.querySelector("#rgf-tag-add").addEventListener("click", () => addFilterFromInput("rgf-tag-input", addTagFilter));
    panel.querySelector("#rgf-user-add").addEventListener("click", () => addFilterFromInput("rgf-user-input", addUserFilter));
    panel.querySelector("#rgf-tag-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") addFilterFromInput("rgf-tag-input", addTagFilter);
    });
    panel.querySelector("#rgf-user-input").addEventListener("keydown", (e) => {
      if (e.key === "Enter") addFilterFromInput("rgf-user-input", addUserFilter);
    });
    panel.querySelector("#rgf-tag-clear").addEventListener("click", () => {
      getTagFilters().slice().reverse().forEach((_, i, a) => removeTagFilter(a.length - 1 - i));
    });
    panel.querySelector("#rgf-user-clear").addEventListener("click", () => {
      getUserFilters().slice().reverse().forEach((_, i, a) => removeUserFilter(a.length - 1 - i));
    });
    panel.querySelector("#rgf-apply").addEventListener("click", () => {
      applyFeedFilters();
      applyExploreFilters();
      updateCount();
    });
    setInterval(updateCount, 2e3);
    refreshPanel();
  }
  function applyAllFilters() {
    applyFeedFilters();
    applyExploreFilters();
  }
  const globalObserver = new MutationObserver((mutations) => {
    const hasNew = mutations.some((m) => m.addedNodes.length > 0);
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
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
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

})();