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
| `tiers.json` | Tier names, colours, badges, and the **default** thresholds and amounts |
| `styles.css` | Tool chrome and the shared board frame |
| `assets/` | The company logo and the app icons |
| `manifest.json`, `sw.js`, `install.js` | Installable app: icons, offline shell, install prompt |
| `404.html` | Short links — turns `/W1` or `/podium` into the studio for that creative |

Creatives come in **couplets**: a leaderboard and the reward poster that matches
it. The two share a look and are meant to go out together, so the home screen
groups them and each one links to its pair.

| Couplet | Leaderboard | Reward info |
| --- | --- | --- |
| Dark | **D1** Yesterday's Winners | **D2** Booster Rewards |
| Yellow | **Y1** Winners Podium | **Y2** Win Cash Rewards |
| Warm gradient | **W1** Simple Winners | **W2** Simple Rewards |

## Creative codes

Every creative has a short permanent code — a couplet letter and a role
digit, where **1 is the leaderboard** and **2 is the reward info**. It is how a
person names one creative out of six without describing it: "the gold amount on
W1 is wrong" beats "the orange one with the list".

The code appears on the card, in the studio header where one tap copies it, in
the browser tab, and at the front of the downloaded file
(`W2-booster-rewards.png`), so a file that reaches someone still says which
creative made it.

A code also works anywhere a template id does:

```
.../booster-reward-generator/W1
.../booster-reward-generator/studio.html?t=W1
```

Codes are written into each template file by hand and **never change or get
reused**, even if a creative is retired. A code that moved would turn every
message that mentions it into a wrong instruction.

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

Thresholds and amounts work like any other field: each board has its own, in a
**Tiers on this board** card in the studio. Change Gold to ₹650 on one
leaderboard and only that board follows — the poster beside it, and every other
template, still shows the defaults. The card says which state it is in and
offers **Back to the defaults**. The numbers are saved with that board's draft,
in that browser.

`tiers.json` holds the defaults every board starts from, along with each tier's
name, colour and badge. Edit it and commit to move the starting point for
everyone:

```json
{ "key": "gold", "name": "Gold", "min": 700, "amount": 500, "mark": "star", ... }
```

- `min` — the daily meters a crew must reach for this tier.
- `amount` — paid to the Operator **and** to the Tracker, so a Gold crew costs 2 × 500.
- `mark` — the tier's badge shape: `diamond`, `star` or `ring`.
- `color`, `edge`, `tint` — how the tier is drawn on a board.

Only `min` and `amount` can be changed per board. A tier's name, colour and
badge always come from this file, so the three tiers look the same everywhere.

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
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/W1
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/W2
https://sharmaxhimanshu1-arch.github.io/booster-reward-generator/podium
```

Either the code or the template id works as the last segment.

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
