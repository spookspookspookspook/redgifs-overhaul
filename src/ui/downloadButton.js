// src/ui/downloadButton.js
import { downloadVideo, openCleanViewer } from '../utils/download.js';
import { getGifFiber } from '../utils/dom.js';



export function injectDownloadButtons(cardEl) {
  const infoBar = cardEl.querySelector('.GifPreview-InfoAndSidebar');
  if (!infoBar) return;

  const actionArea = infoBar.querySelector('.rgf-action-area');
  if (!actionArea) return;

  // Prevent duplicate injection
  if (actionArea.querySelector('.rgvdb-open-btn')) return;
  
  const gif = getGifFiber(cardEl);
  if (!gif || !gif.id) return;
  const videoId = gif.id.toLowerCase();

  // 1. Open in Clean Viewer Button
  const openBtn = document.createElement('button');
  openBtn.className = 'rgf-strip-pill rgvdb-open-btn';
  openBtn.title = 'Play in Clean Viewer';
  openBtn.innerHTML = '▶ Clean View';
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    openCleanViewer(videoId, gif.urls?.hd, gif.userName);
  });
  actionArea.appendChild(openBtn);

  // 2. Download Button
  const downloadBtn = document.createElement('button');
  downloadBtn.className = 'rgf-strip-pill rgvdb-download-btn';
  downloadBtn.title = 'Download HD Video';
  downloadBtn.innerHTML = '📥 Download';
  downloadBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (gif.urls?.hd) {
      downloadVideo(videoId, gif.urls.hd);
    } else {
      alert("HD video URL not found!");
    }
  });
  actionArea.appendChild(downloadBtn);
}
