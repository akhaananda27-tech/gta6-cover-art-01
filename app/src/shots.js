// Fixed scenes for screenshots: ?shot=editor shows the page with a demo photo;
// ?shot=cover shows the cover alone, edge to edge, at the requested post size.
// `layout` / `grade` pick the look, `photo` the demo photo index, `caption` the
// title, `sub` the neon subtitle, `size` the export size. window.__shotReady is
// set once the scene is painted, so a screenshot script can wait on it.

import { SIZES, panelsForLayout } from './state.js';
import { renderCover } from './render.js';

function applyScene(query, state, photos) {
  const layoutId = query.get('layout');
  if (layoutId) {
    state.layoutId = layoutId;
    state.panels = panelsForLayout(state, layoutId);
    state.selected = 0;
  }
  const gradeId = query.get('grade');
  if (gradeId) state.gradeId = gradeId;
  const title = query.get('caption');
  if (title !== null) state.title = title;
  const sub = query.get('sub');
  if (sub !== null) state.subtitle = sub;
  const photo = query.get('photo');
  if (photo !== null) {
    const idx = Number(photo);
    const pick = Number.isFinite(idx) ? idx : 0;
    state.panels = state.panels.map((p, i) => ({ ...p, photo: (pick + i) % Math.max(1, photos.length) }));
  }
  const sizeId = query.get('size');
  if (sizeId) state.sizeId = sizeId;
}

export async function runShot(shot, query, state, photos, redraw) {
  applyScene(query, state, photos);
  const canvas = document.getElementById('cover');
  if (shot === 'cover') {
    // The cover alone: hide the editor chrome and paint at full export size,
    // so the screenshot is the PNG the app writes, scaled down by the browser.
    document.body.classList.add('shot-cover');
    const size = SIZES.find((s) => s.id === state.sizeId) ?? SIZES[0];
    renderCover(canvas, photos.map((p) => p.img), state, { highlight: false, size: { w: size.w, h: size.h } });
  } else {
    redraw();
  }
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
