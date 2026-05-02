// src/utils/download.js
/**
 * Initiates a download for the given video using its HD URL.
 * @param {string} videoId The ID of the video (used for the filename).
 * @param {string} hdUrl The direct HD video URL.
 */
export async function downloadVideo(videoId, hdUrl) {
  const normalizedId = videoId.toLowerCase();

  try {
    const url = hdUrl;
    const extension = url.split('.').pop().split(/[?#]/)[0] || 'mp4';
    const filename = `redgifs-${normalizedId}.${extension}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    const videoBlob = await response.blob();
    const objectUrl = URL.createObjectURL(videoBlob);
    
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  } catch (error) {
    console.error('[RG Overhaul] Download failed:', error);
    alert('Download failed: ' + error.message);
  }
}

/**
 * Opens the video in a clean, minimalist viewer in a new tab.
 * @param {string} videoId The video ID.
 * @param {string} hdUrl The direct HD video URL.
 * @param {string} userName The creator's username (optional).
 */
export function openCleanViewer(videoId, hdUrl, userName = '') {
  const normalizedId = videoId.toLowerCase();
  const watchUrl = `https://www.redgifs.com/watch/${videoId}`;

  if (!hdUrl) {
    // Fallback if URL is missing: open standard page
    window.open(watchUrl, '_blank');
    return;
  }

  const pageTitle = userName ? `${userName} - ${videoId}` : `RedGIFs - ${videoId}`;

  const newWindow = window.open('', '_blank');
  if (!newWindow) {
    alert('Popup blocked. Please allow popups for this site.');
    return;
  }

  try {
    newWindow.opener = null;
  } catch {}

  const doc = newWindow.document;
  try {
    if (!doc.head) doc.documentElement.appendChild(doc.createElement('head'));
    if (!doc.body) doc.documentElement.appendChild(doc.createElement('body'));
  } catch (e) {
    newWindow.location.href = watchUrl;
    return;
  }

  doc.title = pageTitle;
  Object.assign(doc.body.style, {
    margin: '0', padding: '0', backgroundColor: '#000',
    height: '100vh', width: '100vw', display: 'flex',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    fontFamily: 'sans-serif'
  });

  const styleEl = doc.createElement('style');
  styleEl.textContent = `
    video { max-width: 100%; max-height: 100%; outline: none; box-shadow: 0 0 20px rgb(0 0 0 / 0.5); }
    .back-link { position: absolute; top: 16px; right: 16px; color: rgb(255 255 255 / 0.5); text-decoration: none; background: rgb(0 0 0 / 0.5); padding: 8px 12px; border-radius: 4px; font-size: 14px; backdrop-filter: blur(4px); transition: 0.2s; z-index: 9999; }
    .back-link:hover { color: #fff; background: rgb(0 0 0 / 0.8); }
  `;
  doc.head.appendChild(styleEl);

  const videoEl = doc.createElement('video');
  videoEl.src = hdUrl;
  videoEl.controls = true;
  videoEl.autoplay = true;
  videoEl.loop = true;
  videoEl.muted = true;
  videoEl.playsInline = true;
  doc.body.appendChild(videoEl);

  const linkEl = doc.createElement('a');
  linkEl.href = watchUrl;
  linkEl.className = 'back-link';
  linkEl.target = '_blank';
  linkEl.rel = 'noopener noreferrer';
  linkEl.textContent = 'Open Original Page';
  doc.body.appendChild(linkEl);
}
