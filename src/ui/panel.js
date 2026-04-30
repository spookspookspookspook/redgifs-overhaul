// src/ui/panel.js

import { getTagFilters, getUserFilters, addTagFilter, removeTagFilter, addUserFilter, removeUserFilter, subscribe } from '../state.js';
import { applyFeedFilters } from '../filters/feed.js';
import { applyExploreFilters } from '../filters/explore.js';
import { syncStripStates } from './quickAdd.js';

let refreshPanel = () => { };

export function buildPanel() {
    const panel = document.createElement('div');
    panel.id = 'rgf-panel';
    panel.className = 'rgf-collapsed';
    panel.innerHTML = `
      <div id="rgf-header">
        <span>🚫 RedGIFs Filter</span>
        <button id="rgf-collapse-btn" title="Expand">▼</button>
      </div>
      <div class="rgf-body">
        <div class="rgf-section-label">Tag Filters</div>
        <div class="rgf-input-row">
          <input id="rgf-tag-input" type="text" placeholder="amateur  /  *feet*  /  solo*" />
          <button class="rgf-add-btn" id="rgf-tag-add">+</button>
        </div>
        <div class="rgf-pill-list" id="rgf-tag-pills"></div>

        <div class="rgf-section-label">Username Filters</div>
        <div class="rgf-input-row">
          <input id="rgf-user-input" type="text" placeholder="real username or display name" />
          <button class="rgf-add-btn" id="rgf-user-add">+</button>
        </div>
        <div class="rgf-pill-list" id="rgf-user-pills"></div>

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
    const colBtn = panel.querySelector('#rgf-collapse-btn');
    panel.querySelector('#rgf-header').addEventListener('click', () => {
        collapsed = !collapsed;
        panel.classList.toggle('rgf-collapsed', collapsed);
        colBtn.textContent = collapsed ? '▼' : '▲';
    });

    function renderPills(id, arr, onRemove) {
        const container = panel.querySelector('#' + id);
        container.innerHTML = '';
        arr.forEach((f, i) => {
            const pill = document.createElement('span');
            pill.className = 'rgf-panel-pill';
            pill.appendChild(document.createTextNode(f));
            const x = document.createElement('button');
            x.className = 'rgf-panel-pill-x';
            x.textContent = '×';
            x.addEventListener('click', () => onRemove(i));
            pill.appendChild(x);
            container.appendChild(pill);
        });
    }

    function updateCount() {
        const hiddenFeed = document.querySelectorAll('.GifPreview.rgf-filtered').length;
        const totalFeed = document.querySelectorAll('.GifPreview').length;
        
        let countText = '';
        if (totalFeed > 0) {
            countText = `Hiding ${hiddenFeed} of ${totalFeed} feed cards`;
        }

        // Add explore count if we are on explore page
        const exploreItems = document.querySelectorAll('.gifList .tileItem');
        if (exploreItems.length > 0) {
            const hiddenExplore = Array.from(exploreItems).filter(i => i.style.display === 'none').length;
            if (countText) countText += ' | ';
            countText += `Hiding ${hiddenExplore} of ${exploreItems.length} explore tiles`;
        }

        panel.querySelector('#rgf-count').textContent = countText;
    }

    refreshPanel = () => {
        const tagFilters = getTagFilters();
        const userFilters = getUserFilters();
        renderPills('rgf-tag-pills', tagFilters, i => removeTagFilter(i));
        renderPills('rgf-user-pills', userFilters, i => removeUserFilter(i));
        updateCount();
    };

    subscribe(() => {
        refreshPanel();
        applyFeedFilters();
        applyExploreFilters();
        syncStripStates();
    });

    function addFilterFromInput(inputId, addFn) {
        const input = panel.querySelector('#' + inputId);
        const val = input.value.trim();
        if (val) {
            addFn(val);
            input.value = '';
        }
    }

    panel.querySelector('#rgf-tag-add').addEventListener('click', () => addFilterFromInput('rgf-tag-input', addTagFilter));
    panel.querySelector('#rgf-user-add').addEventListener('click', () => addFilterFromInput('rgf-user-input', addUserFilter));
    panel.querySelector('#rgf-tag-input').addEventListener('keydown', e => { if (e.key === 'Enter') addFilterFromInput('rgf-tag-input', addTagFilter); });
    panel.querySelector('#rgf-user-input').addEventListener('keydown', e => { if (e.key === 'Enter') addFilterFromInput('rgf-user-input', addUserFilter); });
    
    panel.querySelector('#rgf-apply').addEventListener('click', () => { 
        applyFeedFilters(); 
        applyExploreFilters();
        updateCount(); 
    });

    setInterval(updateCount, 2000);
    refreshPanel();
}
