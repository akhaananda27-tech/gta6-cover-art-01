# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/akhaananda27-tech/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/akhaananda27-tech/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Heat Cover Studio is an offline web app that turns a photo and a caption into GTA 6-style multi-panel cover art — Vice City sunset and neon grades, a bold gradient title and neon script, exported as a PNG to share. It offers 7 multi-panel layouts, 6 gradient-map colour grades plus Poster Ink, and exports in 1080 x 1080, 1080 x 1350, and 1920 x 1080. Everything is original: no Rockstar logo, artwork, or font. Photos you pick are read on your own machine and never leave it.

## Run it

Serve `app/` with any static HTTP server and open it in desktop Chrome. For example:

```sh
python3 -m http.server --directory app 8080
```

Then open http://localhost:8080 in your browser.

The app works fully offline: every script, font, and sample photo is a file under `app/`, and photos you pick are read on your own machine — nothing is uploaded.

---

<sub>Entered on [make.fun](https://make.fun/?ref=jfeejy4f&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

## Features

- **7 layouts** — Hero Split, Nine Grid, Tilted Snapshots, Triple Strip, Big + Row, Diagonal Cut, and Duet Split.
- **6 grades + Poster Ink** — Vice Sunset, Neon Night, Heatwave, Teal Dusk, Bubblegum, plus a halftone ink treatment.
- **Caption** — a big gradient title (Anton) and a neon script subtitle (Pacifico), both live on the preview.
- **Per-panel tuning** — click a panel to select it, drag to pan the photo inside it, use the zoom slider, or swap which photo it shows.
- **Export** — one click exports all three post sizes at once: 1080 x 1080, 1080 x 1350, and 1920 x 1080. Single-size buttons are there too.
- **Extras** — grain + vignette toggles, undo/redo (Ctrl+Z / Ctrl+Y), and a live preview that always shows the cover exactly as it exports.
- **Demo photos** — two built-in demo photos (Boulevard, Pier) if you don't want to upload your own.

## How to make a cover

1. **Pick a photo** — upload one or more of your own, or use the two built-in demo photos.
2. **Choose a layout** — one of the 7 multi-panel layouts.
3. **Choose a grade** — one of the 6 gradient-map colour grades, or Poster Ink.
4. **Edit the caption** — the big gradient title and neon script subtitle.
5. **Tune each panel** — pan, zoom, or swap the photo in each panel.
6. **Export** — one click exports all three post sizes.

## Files

- `app/index.html` — the editor page
- `app/style.css` — the editor styling
- `app/src/state.js` — cover state, layouts, grades, undo/redo
- `app/src/render.js` — canvas renderer (panels, grades, lettering)
- `app/src/main.js` — page wiring: upload, controls, export
- `app/src/shots.js` — fixed scenes for screenshots (`?shot=`)
- `app/fonts/` — Anton + Pacifico (SIL Open Font License, see `OFL.txt`)
- `app/samples/` — demo photos made with an image model, free to use
- `main.ts` — hands the app in: copies `app/` + `screenshots/` to `/output` and writes `/output/dossier.json`
- `shots.json` — the staged scenes for the screenshots
- `screenshots/` — cover + editor screenshots

The first screenshot by name is the cover: the 1920 x 1080 export, shown at 1280 x 720. The others show the editor with a photo loaded and the portrait and square exports.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```
