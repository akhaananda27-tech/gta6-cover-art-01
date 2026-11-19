// Vice Heat Cover Studio — cover state: layouts, gradient-map grades, undo/redo.
// A layout is a list of panels in normalized [0,1] space; a panel may carry a
// rotation (tilted snapshots) or a clip polygon (diagonal cut). A grade is a
// list of [luminance, colour] stops that a photo's brightness maps through.

export const LAYOUTS = [
  {
    id: 'hero', name: 'Hero Split',
    panels: [
      { x: 0.00, y: 0.00, w: 0.62, h: 1.00 },
      { x: 0.64, y: 0.00, w: 0.36, h: 0.49 },
      { x: 0.64, y: 0.51, w: 0.36, h: 0.49 },
    ],
  },
  {
    id: 'nine', name: 'Nine Grid',
    panels: [
      { x: 0.000, y: 0.000, w: 0.326, h: 0.326 }, { x: 0.337, y: 0.000, w: 0.326, h: 0.326 }, { x: 0.674, y: 0.000, w: 0.326, h: 0.326 },
      { x: 0.000, y: 0.337, w: 0.326, h: 0.326 }, { x: 0.337, y: 0.337, w: 0.326, h: 0.326 }, { x: 0.674, y: 0.337, w: 0.326, h: 0.326 },
      { x: 0.000, y: 0.674, w: 0.326, h: 0.326 }, { x: 0.337, y: 0.674, w: 0.326, h: 0.326 }, { x: 0.674, y: 0.674, w: 0.326, h: 0.326 },
    ],
  },
  {
    id: 'tilted', name: 'Tilted Snaps',
    panels: [
      { x: 0.04, y: 0.06, w: 0.42, h: 0.62, rot: -6 },
      { x: 0.52, y: 0.04, w: 0.42, h: 0.62, rot: 5 },
      { x: 0.24, y: 0.42, w: 0.52, h: 0.52, rot: -2 },
    ],
  },
  {
    id: 'strips', name: 'Triple Strip',
    panels: [
      { x: 0.00, y: 0.00, w: 0.326, h: 1.00 },
      { x: 0.337, y: 0.00, w: 0.326, h: 1.00 },
      { x: 0.674, y: 0.00, w: 0.326, h: 1.00 },
    ],
  },
  {
    id: 'bigrow', name: 'Big + Row',
    panels: [
      { x: 0.00, y: 0.00, w: 1.00, h: 0.60 },
      { x: 0.00, y: 0.62, w: 0.326, h: 0.38 },
      { x: 0.337, y: 0.62, w: 0.326, h: 0.38 },
      { x: 0.674, y: 0.62, w: 0.326, h: 0.38 },
    ],
  },
  {
    id: 'diagonal', name: 'Diagonal Cut',
    panels: [
      { x: 0, y: 0, w: 1, h: 1, clip: [[0, 0], [1, 0], [0, 1]] },
      { x: 0, y: 0, w: 1, h: 1, clip: [[1, 0], [1, 1], [0, 1]] },
    ],
  },
  {
    id: 'duet', name: 'Duet Split',
    panels: [
      { x: 0.00, y: 0.00, w: 0.49, h: 1.00 },
      { x: 0.51, y: 0.00, w: 0.49, h: 1.00 },
    ],
  },
];

export const GRADES = [
  { id: 'sunset', name: 'Vice Sunset', stops: [[0, '#160a2e'], [0.3, '#7b2d8b'], [0.55, '#e8446c'], [0.8, '#ff8a3d'], [1, '#ffd166']] },
  { id: 'neon', name: 'Neon Night', stops: [[0, '#020617'], [0.3, '#0e7490'], [0.55, '#22d3ee'], [0.8, '#e879f9'], [1, '#fdf4ff']] },
  { id: 'heatwave', name: 'Heatwave', stops: [[0, '#1a0500'], [0.3, '#7f1d1d'], [0.55, '#ea580c'], [0.8, '#facc15'], [1, '#fef9c3']] },
  { id: 'teal', name: 'Teal Dusk', stops: [[0, '#04121a'], [0.3, '#0f766e'], [0.55, '#2dd4bf'], [0.8, '#a5f3fc'], [1, '#f0fdfa']] },
  { id: 'bubble', name: 'Bubblegum', stops: [[0, '#2a0a2e'], [0.3, '#a21caf'], [0.55, '#ec4899'], [0.8, '#f9a8d4'], [1, '#fdf2f8']] },
  { id: 'ink', name: 'Poster Ink', ink: true, stops: [[0, '#141210'], [0.5, '#6b655c'], [1, '#f7f1de']] },
];

export const SIZES = [
  { id: '1080x1080', w: 1080, h: 1080 },
  { id: '1080x1350', w: 1080, h: 1350 },
  { id: '1920x1080', w: 1920, h: 1080 },
];

/** A fresh cover: hero layout, sunset grade, panels filled with the demo photos. */
export function freshState() {
  return {
    layoutId: 'hero',
    gradeId: 'sunset',
    title: 'VICE HEAT',
    subtitle: 'Neon nights in the city',
    grain: true,
    vignette: true,
    sizeId: '1080x1080',
    selected: 0,
    // one entry per panel of the current layout: which photo, pan offset, zoom
    panels: [
      { photo: 0, ox: 0, oy: 0, zoom: 1.2 },
      { photo: 1, ox: 0, oy: 0, zoom: 1.2 },
      { photo: 0, ox: 0, oy: 0, zoom: 1.2 },
    ],
  };
}

/** Rebuild the per-panel list when the layout changes, keeping old panels. */
export function panelsForLayout(state, layoutId) {
  const layout = LAYOUTS.find((l) => l.id === layoutId) ?? LAYOUTS[0];
  const old = state.panels;
  return layout.panels.map((_, i) => old[i % old.length] ?? { photo: 0, ox: 0, oy: 0, zoom: 1.2 });
}

/** Serialize the undoable part of the state (photos live outside it). */
export function snapshotState(state) {
  return JSON.stringify({
    layoutId: state.layoutId, gradeId: state.gradeId, title: state.title,
    subtitle: state.subtitle, grain: state.grain, vignette: state.vignette,
    sizeId: state.sizeId, selected: state.selected, panels: state.panels,
  });
}

/** Restore a snapshot taken by snapshotState. */
export function restoreState(state, snapshot) {
  Object.assign(state, JSON.parse(snapshot));
}

/** A tiny undo/redo stack over state snapshots. */
export function createHistory(state) {
  const past = [];
  const future = [];
  return {
    push() {
      past.push(snapshotState(state));
      if (past.length > 60) past.shift();
      future.length = 0;
    },
    undo() {
      if (!past.length) return false;
      future.push(snapshotState(state));
      restoreState(state, past.pop());
      return true;
    },
    redo() {
      if (!future.length) return false;
      past.push(snapshotState(state));
      restoreState(state, future.pop());
      return true;
    },
    canUndo() { return past.length > 0; },
    canRedo() { return future.length > 0; },
  };
}
