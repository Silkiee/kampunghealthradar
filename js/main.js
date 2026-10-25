/* ===== Kampung Health Radar · start-up =====
   1. Loads the data files in data/.
   2. Loads the app scripts below, in this order (each one can use what the earlier ones define).
   3. Draws the page.
   The page needs to be served from a web address (GitHub Pages, or a local web server such as
   VS Code's Live Server). Browsers block loading files when index.html is opened straight
   from disk, so in that case the page explains this instead. */
'use strict';

const KHR_FILES = {
  weekly:      'data/weekly.csv',
  areaFactors: 'data/area-factors.csv',
  flu:         'data/flu-updates.csv',
  areas:       'data/planning-areas.geojson',
  context:     'data/context.json',
};
const KHR_SCRIPTS = [
  'js/model.js',      // data parsing and the outlook model (no page code)
  'js/flu-rules.js',  // flu jab advice rules (no page code)
  'js/config.js',     // diseases, map levels, page state
  'js/compute.js',    // weekly store, area shares, levels
  'js/panel.js',      // left panel and charts
  'js/map.js',        // map and timeline
  'js/controls.js',   // clicks, search, sliders, Add data dialog
  'js/flu-guide.js',  // flu jab guide page
  'js/pages.js',      // switching between map, flu jab guide and legal page
];

let KHR_DATA = null;

async function khrLoadData() {
  const entries = await Promise.all(Object.entries(KHR_FILES).map(async ([key, url]) => {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    return [key, url.endsWith('.csv') ? await res.text() : await res.json()];
  }));
  return Object.fromEntries(entries);
}

// Download the scripts in parallel but run them strictly in list order.
function khrLoadScripts(list) {
  return Promise.all(list.map(src => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.async = false;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`${src} could not be loaded`));
    document.body.appendChild(s);
  })));
}

function khrShowLoadError(err) {
  const local = location.protocol === 'file:';
  const box = document.createElement('div');
  box.setAttribute('role', 'alert');
  box.className = 'load-error';
  box.innerHTML = local
    ? `<b>This page needs to run from a web address.</b>
       <p>Browsers don't let a page opened straight from your computer load its data files.
       Open this folder with a local web server (for example the Live Server extension in VS Code), or use the live site.</p>`
    : `<b>The figures could not be loaded.</b><p>Please refresh the page. (${String(err.message || err)})</p>`;
  document.body.prepend(box);
  console.error(err);
}

(async () => {
  try {
    KHR_DATA = await khrLoadData();
    await khrLoadScripts(KHR_SCRIPTS);
  } catch (err) {
    khrShowLoadError(err);
    return;
  }
  recompute(); update(); route();
})();
