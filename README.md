# Booster Reward Generator

Creative templates for the **Daily Booster** programme at Beckhaul Technologies —
the daily meters target that pays a cash reward to the Machine Operator **and**
the Tracker on a crew.

A manager opens the home screen, picks a template, fills in the details and
downloads a ready-to-send PNG. It is a static site: no server, no database and
no build step.

**Live:** https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/

## What is in here

| Path | What it is |
| --- | --- |
| `index.html`, `home.js` | Home screen — the template gallery, with a live preview on each card |
| `studio.html`, `studio.js` | The editor. Builds its form from whichever template `?t=` names |
| `core.js` | Template registry, tier config, tier badges, preview scaling, PNG export |
| `templates/*.js` | One file per creative. See `templates/README.md` |
| `tiers.json` | **Tier thresholds and amounts. The single source of truth.** |
| `styles.css` | Tool chrome and the shared board frame |
| `assets/` | The company logo and the app icons |
| `manifest.json`, `sw.js`, `install.js` | Installable app: icons, offline shell, install prompt |
| `404.html` | Short links — turns `/podium` into the studio for that template |

Six creatives ship today, as three couplets — a leaderboard and a tier poster
in each style:

| Style | Leaderboard | Tier poster |
| --- | --- | --- |
| Dark | Yesterday's Winners | Booster Rewards |
| Yellow | Winners Podium | Win Cash Rewards |
| Warm gradient | Simple Winners | Simple Rewards |

## Using it

1. Open the site and pick a template.
2. Fill in the details. For the winners board that is the date and one row per
   crew — Operator, Tracker, meters.
3. The tier and the ₹ amount fill in from the meters. The dropdown overrides it
   if a manager needs to award a different tier by hand.
4. Press **Download PNG** and send the image to the crew's WhatsApp group.

Crews below the lowest threshold are flagged in the form and left off the board.
Rows are ranked by meters automatically, and the row height adapts so 5 to 12
crews all fit.

Names typed into a template stay in that manager's browser. Nothing is uploaded
or committed. A half-finished board survives a page reload, per template, but it
is per-browser and not shared.

## Changing the reward amounts

`tiers.json` is what everyone shares. Every template reads it at page load, so
the winners board, the rewards poster and the tier panels all change together.

There are two ways to change a value.

**Try it out, on one device.** The tier panel on the home screen and in the
studio is editable: change a threshold or an amount and every board updates
straight away. That edit is saved in that browser alone and reaches nobody else,
so the panel marks itself *Changed on this device* and offers two buttons —
**Download tiers.json**, which hands you the file with your values in it, and
**Undo my changes**, which goes back to the committed ones.

**Make it stick for everyone.** Commit that downloaded file over `tiers.json`.
Until you do, a manager on another phone still generates boards at the old
amounts, which is the one failure worth watching for: two boards, same day,
different money.

Editing the file directly works just as well:

```json
{ "key": "gold", "name": "Gold", "min": 700, "amount": 500, "mark": "star", ... }
```

- `min` — the daily meters a crew must reach for this tier.
- `amount` — paid to the Operator **and** to the Tracker, so a Gold crew costs 2 × 500.
- `mark` — the tier's badge shape: `diamond`, `star` or `ring`.
- `color`, `edge`, `tint` — how the tier is drawn on a board.

The tiers do not have to be three. Add or remove entries and the forms, the
boards and the legends all follow. Keep the thresholds from overlapping: a crew
is given the highest tier whose `min` it reaches.

## Adding a template

Copy a file in `templates/`, change its `id`, `render()` and `css`, and add one
`<script>` line to `index.html` and `studio.html`. The full contract is in
[`templates/README.md`](templates/README.md).

## Hosting

GitHub Pages serves `main` from the repository root (**Settings → Pages →
Deploy from a branch**).

### Short links

A template opens at its own path, which is what you paste into a crew group:

```
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/podium
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/win
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/winners
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/rewards
```

Pages has no rewrite rules, so `404.html` does the work: it catches any path
with no file behind it, reads the last segment and sends the browser to
`studio.html?t=<id>`. It works for every template, including new ones, with no
file to add. Two consequences worth knowing: the address bar ends up showing
the long form, and the first response carries a 404 status before the redirect,
which some link previews render as a broken link. The long URLs keep working.

### Installing it on a phone

The site is a progressive web app. On Android Chrome the home screen offers an
**Install** button; on an iPhone it shows the Safari steps instead, since Safari
has no install event. Once installed it opens from the home screen icon with no
URL to type.

A service worker caches the app shell, the templates and `tiers.json`
network-first, so the studio still opens on a bad site connection and picks up
changes as soon as there is signal. Exporting a PNG needs the renderer from the
CDN, so a board built with no connection at all may not download until there is
signal again.

After changing a file that the shell caches, bump `CACHE` in `sw.js` if you want
installed phones to drop the old copies rather than refresh them one by one.

This repository is public, so **anyone with the URL can open the site and read
`tiers.json`**, including the reward amounts. The pages carry `noindex` so
search engines skip them, but that is not access control. If the amounts should
not be public, make the repository private — Pages on a private repository needs
a paid GitHub plan.

## Running it locally

`tiers.json` is fetched over HTTP, which browsers block for `file://` pages.
Serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening the files directly still works, but falls back to the tier values built
into `core.js` rather than reading `tiers.json`.

## How a board is exported

A board is ordinary HTML and CSS at its true pixel size, scaled down with a CSS
transform for the preview. On download it is cloned off-screen at full size,
painted by `html2canvas` (loaded from cdnjs) and handed to the browser as a PNG.
Fonts are Archivo and Archivo Black from Google Fonts, so the export waits for
`document.fonts.ready` before painting.
