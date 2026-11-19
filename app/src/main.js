// Vice Heat Cover Studio — page wiring: photos, layouts, grades, caption,
// panel tuning (click to select, drag to pan, zoom, swap photo), undo/redo
// and PNG export in all three post sizes. A `?shot=` query sets up a fixed
// scene for a screenshot instead (see ./shots.js).

import { LAYOUTS, GRADES, SIZES, freshState, panelsForLayout, createHistory } from './state.js';
import { renderCover } from './render.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const state = freshState();
const history = createHistory(state);
const photos = []; // { img, name } — the two demo photos, then the user's uploads
let activePhoto = 0;
let drag = null;

export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** Preview at most 900 px on the long side; exports always render full size. */
function previewSize() {
  const size = SIZES.find((s) => s.id === state.sizeId) ?? SIZES[0];
  const scale = Math.min(1, 900 / Math.max(size.w, size.h));
  return { w: Math.round(size.w * scale), h: Math.round(size.h * scale) };
}

function redraw(highlight = true) {
  const { w, h } = previewSize();
  renderCover(canvas, photos.map((p) => p.img), state, { highlight, size: { w, h } });
  $('undoBtn').disabled = !history.canUndo();
  $('redoBtn').disabled = !history.canRedo();
}

function commit() {
  history.push();
  redraw();
}

/** Rebuild the photo strip thumbnails; click one to fill the selected panel. */
function renderPhotoStrip() {
  const strip = $('photoStrip');
  strip.innerHTML = '';
  photos.forEach((p, i) => {
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    img.title = p.name;
    img.className = i === activePhoto ? 'active' : '';
    img.setAttribute('role', 'option');
    img.addEventListener('click', () => {
      activePhoto = i;
      state.panels[state.selected].photo = i;
      commit();
      renderPhotoStrip();
    });
    strip.appendChild(img);
  });
}

/** Layout buttons with a tiny panel diagram inside each. */
function renderLayoutButtons() {
  const grid = $('layoutGrid');
  grid.innerHTML = '';
  LAYOUTS.forEach((layout) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'layout-btn';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-pressed', String(state.layoutId === layout.id));
    const mini = layout.panels.map((p) => {
      const rot = p.rot ? ` transform: rotate(${p.rot}deg);` : '';
      return `<i style="left:${p.x * 100}%;top:${p.y * 100}%;width:${p.w * 100}%;height:${p.h * 100}%;${rot}"></i>`;
    }).join('');
    b.innerHTML = `<span class="mini">${mini}</span>${layout.name}`;
    b.addEventListener('click', () => {
      state.layoutId = layout.id;
      state.panels = panelsForLayout(state, layout.id);
      state.selected = 0;
      commit();
      renderLayoutButtons();
      syncPanelTools();
    });
    grid.appendChild(b);
  });
}

/** Grade buttons with a gradient swatch of their stops. */
function renderGradeButtons() {
  const grid = $('gradeGrid');
  grid.innerHTML = '';
  GRADES.forEach((grade) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'grade-btn';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-pressed', String(state.gradeId === grade.id));
    const stops = grade.stops.map(([at, hex]) => `${hex} ${Math.round(at * 100)}%`).join(', ');
    b.innerHTML = `<span class="swatch" style="background:linear-gradient(90deg, ${stops})"></span>${grade.name}`;
    b.addEventListener('click', () => {
      state.gradeId = grade.id;
      commit();
      renderGradeButtons();
    });
    grid.appendChild(b);
  });
}

function syncPanelTools() {
  const ps = state.panels[state.selected];
  $('zoomInput').value = String(ps?.zoom ?? 1.2);
  $('panelHint').textContent = ps
    ? `Panel ${state.selected + 1} selected — drag on the cover to pan, zoom, or swap its photo.`
    : 'Click a panel on the cover to select it.';
}

function layoutPanels() {
  return LAYOUTS.find((l) => l.id === state.layoutId)?.panels ?? LAYOUTS[0].panels;
}

function panelAt(nx, ny) {
  const panels = layoutPanels();
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (nx >= p.x && nx <= p.x + p.w && ny >= p.y && ny <= p.y + p.h) return i;
  }
  return -1;
}

canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const nx = (e.clientX - rect.left) / rect.width;
  const ny = (e.clientY - rect.top) / rect.height;
  const i = panelAt(nx, ny);
  if (i < 0) return;
  state.selected = i;
  syncPanelTools();
  redraw();
  canvas.setPointerCapture(e.pointerId);
  drag = { x: e.clientX, y: e.clientY, moved: false };
  canvas.classList.add('dragging');
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const panels = layoutPanels();
  const panel = panels[state.selected];
  const ps = state.panels[state.selected];
  if (!panel || !ps) return;
  const dx = (e.clientX - drag.x) / rect.width / panel.w;
  const dy = (e.clientY - drag.y) / rect.height / panel.h;
  if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) > 2) drag.moved = true;
  ps.ox = (ps.ox || 0) + dx;
  ps.oy = (ps.oy || 0) + dy;
  drag.x = e.clientX; drag.y = e.clientY;
  redraw();
});
canvas.addEventListener('pointerup', () => {
  canvas.classList.remove('dragging');
  if (drag?.moved) history.push();
  drag = null;
  redraw();
});

$('photoInput').addEventListener('change', async (e) => {
  for (const file of e.target.files) {
    const img = await loadImage(URL.createObjectURL(file));
    photos.push({ img, name: file.name });
  }
  if (photos.length) {
    activePhoto = photos.length - 1;
    state.panels[state.selected].photo = activePhoto;
  }
  e.target.value = '';
  renderPhotoStrip();
  commit();
});

$('titleInput').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
$('titleInput').addEventListener('change', () => history.push());
$('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
$('subtitleInput').addEventListener('change', () => history.push());
$('grainInput').addEventListener('change', (e) => { state.grain = e.target.checked; commit(); });
$('vignetteInput').addEventListener('change', (e) => { state.vignette = e.target.checked; commit(); });

$('cyclePhotoBtn').addEventListener('click', () => {
  const ps = state.panels[state.selected];
  ps.photo = (ps.photo + 1) % photos.length;
  activePhoto = ps.photo;
  commit();
  renderPhotoStrip();
});
$('zoomInput').addEventListener('input', (e) => {
  state.panels[state.selected].zoom = parseFloat(e.target.value);
  redraw();
});
$('zoomInput').addEventListener('change', () => history.push());
$('resetPanelBtn').addEventListener('click', () => {
  state.panels[state.selected] = { photo: activePhoto, ox: 0, oy: 0, zoom: 1.2 };
  commit();
  syncPanelTools();
});

$('undoBtn').addEventListener('click', () => { if (history.undo()) { redraw(); renderLayoutButtons(); renderGradeButtons(); syncPanelTools(); } });
$('redoBtn').addEventListener('click', () => { if (history.redo()) { redraw(); renderLayoutButtons(); renderGradeButtons(); syncPanelTools(); } });
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); $('undoBtn').click(); }
  if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); $('redoBtn').click(); }
});

/** Render one size at full resolution and download it as a PNG. */
export async function exportSize(sizeId) {
  const size = SIZES.find((s) => s.id === sizeId) ?? SIZES[0];
  const off = document.createElement('canvas');
  renderCover(off, photos.map((p) => p.img), state, { highlight: false, size: { w: size.w, h: size.h } });
  const blob = await new Promise((resolve) => off.toBlob(resolve, 'image/png'));
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `vice-heat-${size.id}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return { name: a.download, bytes: blob.size, w: size.w, h: size.h };
}

$('exportAllBtn').addEventListener('click', async () => {
  $('status').textContent = 'Exporting all 3 sizes…';
  const done = [];
  for (const s of SIZES) done.push(await exportSize(s.id));
  $('status').textContent = `Saved ${done.map((d) => d.name).join(', ')}`;
  window.__exports = done;
});
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', async () => {
    const d = await exportSize(b.dataset.size);
    $('status').textContent = `Saved ${d.name}`;
    window.__exports = [d];
  });
});

/** Boot: load the bundled fonts and the two demo photos, then paint.
 * The fonts are local files, so this also works with no network at all. */
async function boot() {
  try {
    await Promise.race([
      Promise.all([document.fonts.load('16px Anton'), document.fonts.load('16px Pacifico'), document.fonts.ready]),
      new Promise((r) => setTimeout(r, 3000)),
    ]);
  } catch { /* fall back to system fonts; the cover still renders */ }
  for (const name of ['boulevard', 'pier']) {
    try {
      photos.push({ img: await loadImage(`samples/${name}.jpg`), name });
    } catch { /* a missing demo photo just leaves the other one */ }
  }
  renderPhotoStrip();
  renderLayoutButtons();
  renderGradeButtons();
  syncPanelTools();

  const shot = new URLSearchParams(location.search).get('shot');
  if (shot) {
    await runShot(shot, new URLSearchParams(location.search), state, photos, redraw);
    // A shot scene rewrites the state; make the controls show the scene too.
    // (For a cover shot the canvas already holds the full-size cover, so do
    // not redraw the small preview over it.)
    $('titleInput').value = state.title;
    $('subtitleInput').value = state.subtitle;
    $('grainInput').checked = state.grain;
    $('vignetteInput').checked = state.vignette;
    renderLayoutButtons();
    renderGradeButtons();
    syncPanelTools();
    if (shot !== 'cover') redraw();
  } else {
    redraw();
  }
}

boot();
