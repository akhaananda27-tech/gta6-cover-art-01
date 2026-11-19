// Vice Heat Cover Studio — canvas renderer. renderCover draws the whole cover
// (panels, gradient-map grade, title lettering, grain, vignette) at any size,
// so the live preview and the exported PNGs come from the same code.

import { LAYOUTS, GRADES } from './state.js';

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Build a 256-entry luminance -> [r, g, b] lookup table from a grade's stops. */
export function buildGradeLut(grade) {
  const lut = new Uint8Array(256 * 3);
  const stops = grade.stops.map(([at, hex]) => [at, hexRgb(hex)]);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
  }
  return lut;
}

/** Map every pixel of an offscreen canvas through the grade lookup table. */
export function applyGradeToCanvas(off, grade) {
  const ctx = off.getContext('2d');
  const img = ctx.getImageData(0, 0, off.width, off.height);
  const d = img.data;
  const lut = buildGradeLut(grade);
  for (let i = 0; i < d.length; i += 4) {
    const l = (d[i] * 77 + d[i + 1] * 150 + d[i + 2] * 29) >> 8;
    d[i] = lut[l * 3]; d[i + 1] = lut[l * 3 + 1]; d[i + 2] = lut[l * 3 + 2];
  }
  ctx.putImageData(img, 0, 0);
}

/** A tileable halftone dot pattern, used by the Poster Ink grade. */
function halftonePattern() {
  const p = document.createElement('canvas');
  p.width = 10; p.height = 10;
  const c = p.getContext('2d');
  c.fillStyle = '#000';
  c.beginPath(); c.arc(5, 5, 2.4, 0, Math.PI * 2); c.fill();
  return p;
}

/** A tileable film-grain noise pattern, built once and reused. */
let grainTile = null;
function grainPattern() {
  if (grainTile) return grainTile;
  grainTile = document.createElement('canvas');
  grainTile.width = 160; grainTile.height = 160;
  const c = grainTile.getContext('2d');
  const img = c.createImageData(160, 160);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 96 + Math.floor(Math.random() * 64);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  return grainTile;
}

/** Draw one photo into one panel rect (cover-fit, pan + zoom), graded. */
export function drawPanel(ctx, panel, img, panelState, W, H, grade) {
  const px = panel.x * W, py = panel.y * H, pw = panel.w * W, ph = panel.h * H;
  if (pw < 2 || ph < 2) return;
  // Paint the photo onto a panel-sized offscreen canvas, grade it, then place it.
  const off = document.createElement('canvas');
  off.width = Math.max(2, Math.round(pw));
  off.height = Math.max(2, Math.round(ph));
  const octx = off.getContext('2d');
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * (panelState.zoom || 1);
  const dw = img.naturalWidth * base, dh = img.naturalHeight * base;
  const maxOx = Math.max(0, (dw - pw) / 2 / pw), maxOy = Math.max(0, (dh - ph) / 2 / ph);
  const ox = Math.max(-maxOx, Math.min(maxOx, panelState.ox || 0));
  const oy = Math.max(-maxOy, Math.min(maxOy, panelState.oy || 0));
  octx.drawImage(img, (pw - dw) / 2 + ox * pw, (ph - dh) / 2 + oy * ph, dw, dh);
  applyGradeToCanvas(off, grade);

  ctx.save();
  if (panel.clip) {
    ctx.beginPath();
    panel.clip.forEach(([cx, cy], i) => (i ? ctx.lineTo(cx * W, cy * H) : ctx.moveTo(cx * W, cy * H)));
    ctx.closePath(); ctx.clip();
  }
  if (panel.rot) {
    ctx.translate(px + pw / 2, py + ph / 2);
    ctx.rotate((panel.rot * Math.PI) / 180);
    ctx.translate(-pw / 2, -ph / 2);
  }
  if (panel.rot) {
    // Polaroid card: white frame, thicker at the bottom, soft shadow.
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = W * 0.02; ctx.shadowOffsetY = W * 0.008;
    ctx.fillStyle = '#f7f1de';
    ctx.fillRect(-pw * 0.04, -ph * 0.04, pw * 1.08, ph * 1.12);
    ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
    ctx.drawImage(off, 0, 0, pw, ph);
  } else if (panel.clip) {
    ctx.drawImage(off, px, py, pw, ph);
  } else {
    ctx.drawImage(off, px, py, pw, ph);
  }
  ctx.restore();

  // Thin dark gutter between flat panels.
  if (!panel.rot && !panel.clip) {
    ctx.strokeStyle = 'rgba(10,4,18,0.9)';
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(px, py, pw, ph);
  }
}

/** The bold gradient title + neon script subtitle, bottom-left, slightly tilted. */
export function drawTitleLettering(ctx, state, W, H) {
  const pad = W * 0.045;
  const bandH = H * 0.30;
  const band = ctx.createLinearGradient(0, H - bandH, 0, H);
  band.addColorStop(0, 'rgba(8,2,16,0)');
  band.addColorStop(1, 'rgba(8,2,16,0.62)');
  ctx.fillStyle = band;
  ctx.fillRect(0, H - bandH, W, bandH);

  const title = (state.title || 'VICE HEAT').toUpperCase();
  let size = Math.round(W * 0.115);
  ctx.font = `${size}px Anton, sans-serif`;
  while (ctx.measureText(title).width > W * 0.92 && size > 24) {
    size -= 4;
    ctx.font = `${size}px Anton, sans-serif`;
  }
  const titleY = H - pad - size * 0.32;
  const grad = ctx.createLinearGradient(pad, titleY - size, pad + W * 0.6, titleY);
  grad.addColorStop(0, '#ffd166');
  grad.addColorStop(0.45, '#ff8a3d');
  grad.addColorStop(0.75, '#ff2e88');
  grad.addColorStop(1, '#e879f9');
  ctx.save();
  ctx.translate(pad, titleY);
  ctx.rotate(-0.03);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(16,4,24,0.9)';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = grad;
  ctx.fillText(title, 0, 0);
  ctx.restore();

  const sub = state.subtitle || '';
  if (sub) {
    const subSize = Math.round(W * 0.042);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.save();
    ctx.translate(pad + W * 0.01, H - pad * 0.55);
    ctx.rotate(-0.03);
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = W * 0.02;
    ctx.fillStyle = '#fff';
    ctx.fillText(sub, 0, 0);
    ctx.shadowBlur = W * 0.008;
    ctx.fillText(sub, 0, 0);
    ctx.restore();
  }
}

/** Speckle film grain over the whole cover. */
export function drawGrain(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.10;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainPattern(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** Darken the corners so the centre pops. */
export function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.42)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

/** Draw the full cover onto `canvas` at W x H. `photos` are loaded Images.
 * `size` overrides the state's export size (the live preview renders small
 * for speed; exports render at full resolution from the same code). */
export function renderCover(canvas, photos, state, { highlight = false, size = null } = {}) {
  const picked = size ?? (state.sizeId === '1080x1350' ? { w: 1080, h: 1350 }
    : state.sizeId === '1920x1080' ? { w: 1920, h: 1080 } : { w: 1080, h: 1080 });
  const W = picked.w, H = picked.h;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const layout = LAYOUTS.find((l) => l.id === state.layoutId) ?? LAYOUTS[0];
  const grade = GRADES.find((g) => g.id === state.gradeId) ?? GRADES[0];

  // Backdrop: a deep sunset radial, visible between tilted cards.
  const bg = ctx.createRadialGradient(W * 0.5, H * 0.15, 10, W * 0.5, H * 0.5, Math.max(W, H) * 0.8);
  bg.addColorStop(0, '#3b1155');
  bg.addColorStop(0.6, '#1c0a2e');
  bg.addColorStop(1, '#0d0714');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  layout.panels.forEach((panel, i) => {
    const ps = state.panels[i] ?? { photo: 0, ox: 0, oy: 0, zoom: 1.2 };
    const img = photos[(ps.photo ?? 0) % Math.max(1, photos.length)];
    if (!img) return;
    drawPanel(ctx, panel, img, ps, W, H, grade);
    if (highlight && i === state.selected) {
      ctx.save();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = Math.max(3, W * 0.006);
      ctx.setLineDash([W * 0.02, W * 0.012]);
      ctx.strokeRect(panel.x * W + 2, panel.y * H + 2, panel.w * W - 4, panel.h * H - 4);
      ctx.restore();
    }
  });

  if (grade.ink) {
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = ctx.createPattern(halftonePattern(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  drawTitleLettering(ctx, state, W, H);
  if (state.grain) drawGrain(ctx, W, H);
  if (state.vignette) drawVignette(ctx, W, H);
  return { w: W, h: H };
}
