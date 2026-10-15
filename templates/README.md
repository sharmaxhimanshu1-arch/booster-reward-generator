# Adding a template

A template is one self-contained file in this folder that registers itself with
the core. Nothing else needs to change except one `<script>` line on each page.

## Steps

1. Copy `rewards.js` (no rows) or `winners.js` (repeating rows) to
   `templates/<your-id>.js`.
2. Change `id`, `name` and `description`. The `id` appears in the URL as
   `studio.html?t=<your-id>`.
3. Edit `render()` and `css`.
4. Add `<script src="templates/<your-id>.js"></script>` to **`index.html`** and
   **`studio.html`**, after `core.js`.

The home screen, the form, the preview and the PNG download all follow from the
definition. There is no build step.

## The contract

```js
Booster.register({
  id: "winners",                      // URL slug, unique
  name: "Yesterday's Winners",        // card title
  description: "...",                 // one line on the card
  size: { w: 1080, h: 1350 },         // exported pixel size
  background: "#0E1419",              // fills any transparent edge on export

  fields: [                           // the non-repeating inputs
    { key: "date", type: "date", label: "Board date", default: "today" }
  ],

  rows: null,                         // or the repeating-rows definition below

  filename: function (state) { return "my-board.png"; },
  render: function (state, config) { return "<div class='bd'>...</div>"; },
  css: ".bd-mine .thing { ... }"
});
```

### Fields

`type` is `text`, `textarea`, `number` or `date`. `default` seeds the form, and
the literal `"today"` on a date field means the current date. `hint` adds a line
of help under the input. Values arrive as `state.values[key]`.

### Rows

Leave `rows: null` for a creative with no repeating list. Otherwise:

```js
rows: {
  label: "Winners",                   // card heading
  addLabel: "Add crew",               // button text
  columns: [
    { key: "op", type: "text", label: "Operator", placeholder: "...", grow: true },
    { key: "m",  type: "number", label: "Meters", width: "100px" },
    { key: "tier", type: "tier", label: "Tier", width: "186px" }
  ],
  examples: [ { op: "Ramesh Yadav", m: 1180 } ]
}
```

`grow: true` makes a column share the leftover width; otherwise give it a
`width`. The `tier` type renders a dropdown that defaults to the tier derived
from the row's `m` value and lets a manager override it. Rows arrive as
`state.rows`, an array of objects keyed by column.

Two optional helpers, used when `rows` is set:

- `eligible(state, config)` — the rows that belong on the board, already sorted
  and capped. The studio refuses to export when this is empty.
- `status(state, config)` — the line printed under the row list, for counts and
  warnings.

### render(state, config)

Return an HTML string whose root carries the shared `bd` class plus your own,
for example `<div class="bd bd-rewards">`. The `bd` class provides the fixed
1080 × 1350 frame, the padding, the dark ground and the base font. `config` is
the parsed `tiers.json`, so read amounts from `config.tiers` rather than typing
them in — that is what keeps a creative from drifting out of step with the
programme.

Escape anything a manager typed with `Booster.esc()`.

### What core.js gives you

| Call | What it does |
| --- | --- |
| `Booster.esc(s)` | HTML-escape a value |
| `Booster.todayISO()` | today as `YYYY-MM-DD` |
| `Booster.formatDate(iso)` | `14 OCT 2026` |
| `Booster.sortedTiers()` | tiers, highest threshold first |
| `Booster.tierFor(meters)` | the tier a number earns, or `null` |
| `Booster.effectiveTier(row)` | a row's tier, honouring a manual override |
| `Booster.mark(tier, size)` | the tier's badge as inline SVG |
| `Booster.getConfig()` | the parsed `tiers.json` |

## Fonts

A template may use a face the pages do not load yet. Add it to the Google Fonts
`<link>` in **both** `index.html` and `studio.html`, and give the CSS a real
fallback stack.

Watch what happens when that font does not load. Condensed faces such as Anton
and Barlow Condensed are much narrower than the fallback, so a line sized to fit
with them can wrap without them — and on a fixed-height board one extra line
pushes everything past the frame. Build each band so it cannot grow: give the
fixed bands `flex: none`, let one band flex with `min-height: 0`, and put
`white-space: nowrap` on headings sized to the exact width.

## Keep in mind

- The board is painted by `html2canvas`, which supports ordinary layout, CSS
  gradients and inline SVG. It does not run animations, and it cannot reach
  images from other domains, so keep assets inside `assets/`.
- Size the board so its content fits exactly. There is no overflow protection;
  anything past the frame is cropped out of the PNG.
- A manager may type a very long name. Let text ellipsis or wrap rather than
  pushing the layout wider.
