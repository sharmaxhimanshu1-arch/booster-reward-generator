# Booster Reward Generator

Tools and artwork for the **Daily Booster** programme at Beckhaul Technologies — the daily
meters target that pays a cash reward to the Machine Operator **and** the Tracker on a crew.

Everything here is a static site. There is no server, no database and no build step.

## What is in here

| Path | What it is |
| --- | --- |
| `index.html` | **Daily Booster Studio** — the tool managers use to make the winners board |
| `app.js`, `styles.css` | The tool's logic and styling |
| `tiers.json` | **The tier thresholds and amounts. The single source of truth.** |
| `boards/booster-rewards.html` | The standing "Booster Rewards" poster that explains the tiers |
| `assets/beckhaul-logo.png` | The company logo used on both boards |

## Using the studio

1. Open the site.
2. Set the board date (it defaults to today, so pick yesterday for a morning post).
3. Type each crew: Operator, Tracker and the meters they laid.
4. The tier and the ₹ amount fill in from the meters. The dropdown overrides it if a manager
   needs to award a different tier by hand.
5. Press **Download PNG** and send the image to the crew's WhatsApp group.

Crews below the lowest threshold are flagged in the form and left off the board. Rows are
ranked by meters automatically, and the row height adapts so 5 to 12 crews all fit.

Names typed into the tool stay in that manager's browser. Nothing is uploaded or committed.
A half-finished board survives a page reload, but it is per-browser and not shared.

## Changing the reward amounts

Edit `tiers.json` and commit. Every manager picks up the change on their next page load.

```json
{ "key": "gold", "name": "Gold", "min": 700, "amount": 500, "mark": "star", ... }
```

- `min` — the daily meters a crew must reach for this tier.
- `amount` — paid to the Operator **and** to the Tracker, so a Gold crew costs 2 × 500.
- `mark` — the tier's badge shape: `diamond`, `star` or `ring`.
- `color`, `edge`, `tint` — how the tier is drawn on the board.

The tiers do not have to be three. Add or remove entries and the tool, the tier reference
panel and the board legend all follow. Keep the thresholds from overlapping: a crew is given
the highest tier whose `min` it reaches.

`boards/booster-rewards.html` is hand-written artwork and does **not** read `tiers.json`.
If you change an amount, update that poster too.

## Hosting on GitHub Pages

In this repository: **Settings → Pages → Build and deployment → Deploy from a branch**, then
pick branch `main` and folder `/ (root)`. Save. The site appears a minute later at:

```
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/
```

The poster is at `/boards/booster-rewards.html`.

This repository is public, so **anyone with the URL can open the site and read `tiers.json`**,
including the reward amounts. The pages carry `noindex` so search engines skip them, but that
is not access control. If the amounts should not be public, make the repository private — Pages
on a private repository needs a paid GitHub plan.

## Running it locally

`tiers.json` is fetched over HTTP, which browsers block for `file://` pages. Serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly still works, but it falls back to the tier values built into
`app.js` rather than reading `tiers.json`.

## How the board is rendered

The board is ordinary HTML and CSS at exactly 1080 × 1350 px. `html2canvas` (loaded from
cdnjs) paints that element to a canvas, and the canvas is handed to the browser as a PNG
download. Fonts are Archivo and Archivo Black from Google Fonts, so the export waits for
`document.fonts.ready` before painting.
