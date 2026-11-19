# Vice Heat Cover Studio

A web app that turns a photo and a caption into GTA 6-style multi-panel
cover art — Vice City sunset and neon grades, bold gradient lettering,
exported as a PNG to share. Built for the make.fun `gta6-cover-art-01`
bounty. Everything is original: no Rockstar logo, artwork, or font.

## Run it

Serve `app/` with any static HTTP server and open `app/index.html` in
desktop Chrome. For example:

```sh
cd app && python3 -m http.server 8080
```

The app works fully offline: every script, font, and sample photo is a
file under `app/`, and photos you pick are read on your own machine —
nothing is uploaded.

## How to make a cover

1. **Pick a photo** — upload one or more of your own, or use the two
   built-in demo photos (Boulevard, Pier).
2. **Choose a layout** — 7 multi-panel layouts: Hero Split, Nine Grid,
   Tilted Snapshots, Triple Strip, Big + Row, Diagonal Cut, and Duet Split.
3. **Choose a grade** — 6 gradient-map colour grades (Vice Sunset, Neon
   Night, Heatwave, Teal Dusk, Bubblegum) plus Poster Ink, a halftone
   ink treatment.
4. **Edit the caption** — a big gradient title (Anton) and a neon script
   subtitle (Pacifico). Both are live on the preview.
5. **Tune each panel** — click a panel to select it, drag to pan the
   photo inside it, use the zoom slider, or swap which photo it shows.
6. **Export** — one click exports all three post sizes at once:
   1080 x 1080, 1080 x 1350, and 1920 x 1080. Single-size buttons are
   there too.

Extras: grain + vignette toggles, undo/redo (Ctrl+Z / Ctrl+Y), and a
live preview that always shows the cover exactly as it exports.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the editor styling
- `app/src/state.js` — cover state, layouts, grades, undo/redo
- `app/src/render.js` — canvas renderer (panels, grades, lettering)
- `app/src/main.js` — page wiring: upload, controls, export
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=`)
- `app/fonts/` — Anton + Pacifico (SIL Open Font License, see `OFL.txt`)
- `app/samples/` — demo photos made with an image model, free to use
- `main.ts` — hands the app in: copies `app/` + `screenshots/` to
  `/output` and writes `/output/dossier.json`
- `shots.json` — the staged scenes for the screenshots
- `screenshots/` — cover + editor screenshots

The first screenshot by name is the cover: the 1920 x 1080 export, shown
at 1280 x 720. The others show the editor with a photo loaded and the
portrait and square exports.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
