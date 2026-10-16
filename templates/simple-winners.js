/* Template: Simple Winners
 *
 * The original leaderboard the crews liked: warm gradient, a translucent panel
 * of ranked rows, and the tier guide along the bottom. Kept deliberately plain.
 *
 * What the first draft was missing, and what this adds:
 *   - the Tracker, who is paid the same as the Operator but never appeared
 *   - the Diamond tier, which the guide left out entirely
 *   - the cash amount on each row, so a crew sees what it earned
 *   - "+" on the thresholds, so 650 m is clearly Silver and not a near miss
 *   - tier colours that match their names (the draft had GOLD in green)
 */
Booster.register({
  id: "simple-winners",
  name: "Simple Winners",
  description: "The plain ranked list on the warm gradient. One row per crew, the tier guide underneath.",
  size: { w: 1080, h: 1350 },
  background: "#F7941E",

  fields: [
    { key: "date", type: "date", label: "Board date", default: "today",
      hint: "Post it in the morning, so this is usually yesterday." },
    { key: "eyebrow", type: "text", label: "Eyebrow", default: "DAILY BOOSTER" },
    { key: "title", type: "text", label: "Title", default: "YESTERDAY’S WINNERS" }
  ],

  rows: {
    label: "Winners",
    addLabel: "Add crew",
    columns: [
      { key: "op", type: "text", label: "Operator", placeholder: "Operator name", grow: true },
      { key: "tr", type: "text", label: "Tracker", placeholder: "Tracker name", grow: true },
      { key: "m", type: "number", label: "Meters", placeholder: "0", width: "100px" },
      { key: "tier", type: "tier", label: "Tier", width: "186px" }
    ],
    examples: [
      { op: "Ramesh Yadav", tr: "Imran Sheikh", m: 1180 },
      { op: "Sunil Kumar", tr: "Arjun Nair", m: 920 },
      { op: "Vikas Patil", tr: "Deepak Sahu", m: 845 },
      { op: "Manoj Kumar", tr: "Rakesh Meena", m: 712 },
      { op: "Sandeep Jat", tr: "Prakash Rao", m: 690 },
      { op: "Irfan Qureshi", tr: "Santosh Gond", m: 672 },
      { op: "Ajay Chauhan", tr: "Naveen Reddy", m: 655 },
      { op: "Harpreet Singh", tr: "Mahesh Bhoi", m: 640 },
      { op: "Balram Meghwal", tr: "Suresh Barman", m: 618 },
      { op: "Govind Tirkey", tr: "Ashok Nayak", m: 604 }
    ]
  },

  filename: function (state) {
    return "booster-winners-" + (state.values.date || Booster.todayISO()) + ".png";
  },

  eligible: function (state, config) {
    return state.rows
      .filter(function (r) { return (r.op || r.tr) && r.m > 0 && Booster.effectiveTier(r); })
      .sort(function (a, b) { return b.m - a.m; })
      .slice(0, config.maxRowsOnBoard || 12);
  },

  status: function (state, config) {
    var filled = state.rows.filter(function (r) { return (r.op || r.tr) && r.m > 0; });
    var below = filled.filter(function (r) { return !Booster.effectiveTier(r); }).length;
    var shown = this.eligible(state, config).length;
    var cut = (filled.length - below) - shown;

    var note = shown + (shown === 1 ? " crew" : " crews") + " on the board.";
    if (below) {
      note += " " + below + " below the lowest tier, so " +
        (below === 1 ? "it is" : "they are") + " left off.";
    }
    if (cut > 0) note += " Only the top " + shown + " fit, so " + cut + " more " + (cut === 1 ? "is" : "are") + " cut.";
    return note;
  },

  render: function (state, config) {
    var esc = Booster.esc;
    var cur = config.currency;
    var rows = this.eligible(state, config);
    var n = rows.length;

    var header = '<div class="sw-head">' +
      '<div class="sw-badge"><img src="' + esc(config.brand.logo) + '" alt="' + esc(config.brand.name) + '"></div>' +
      '<div class="sw-headtext">' +
      '<div class="sw-eyebrow">' + esc(state.values.eyebrow) + "</div>" +
      '<div class="sw-title">' + esc(state.values.title) + "</div>" +
      '<div class="sw-date">' + esc(Booster.formatDate(state.values.date)) + "</div>" +
      "</div></div>";

    var colhead = '<div class="sw-colhead">' +
      '<div class="sw-c-rank">RANK</div>' +
      '<div class="sw-c-name">OPERATOR</div>' +
      '<div class="sw-c-name">TRACKER</div>' +
      '<div class="sw-c-reward">REWARD</div>' +
      '<div class="sw-c-meters">METERS</div></div>';

    var body;
    if (!n) {
      body = '<div class="sw-panel sw-empty">Add a crew and the board fills in here.</div>';
    } else {
      var rowH = Math.max(56, Math.min(92, Math.floor(828 / n)));
      var nameSize = rowH >= 78 ? 32 : rowH >= 66 ? 29 : 26;

      body = '<div class="sw-panel">';
      for (var i = 0; i < n; i++) {
        var r = rows[i];
        var t = Booster.effectiveTier(r);
        body += '<div class="sw-row" style="height:' + rowH + 'px">' +
          '<div class="sw-c-rank sw-rank">' + (i + 1) + "</div>" +
          '<div class="sw-c-name sw-name" style="font-size:' + nameSize + 'px">' + esc(r.op || "—") + "</div>" +
          '<div class="sw-c-name sw-name" style="font-size:' + nameSize + 'px">' + esc(r.tr || "—") + "</div>" +
          '<div class="sw-c-reward"><span class="sw-chip" style="background:' + t.color + '">' +
          esc(String(t.name).toUpperCase()) + ' <b>' + cur + t.amount + "</b></span></div>" +
          '<div class="sw-c-meters sw-meters">' + r.m + "</div></div>";
      }
      body += "</div>";
    }

    var guide = '<div class="sw-guide">' + Booster.sortedTiers().map(function (t) {
      return '<div class="sw-gcard">' +
        '<div class="sw-gleft"><div class="sw-gnum">' + t.min + "+</div>" +
        '<div class="sw-glabel">METERS / DAY</div></div>' +
        '<div class="sw-gright" style="background:' + t.color + '">' +
        '<div class="sw-gtier">' + esc(t.name) + "</div>" +
        '<div class="sw-gamt">' + cur + t.amount + " each</div></div></div>";
    }).join("") + "</div>";

    var note = '<div class="sw-note">Operator and Tracker each take home the amount shown.</div>';

    return '<div class="bd bd-simple-winners">' +
      '<div class="sw-glow sw-glow-a" aria-hidden="true"></div>' +
      '<div class="sw-glow sw-glow-b" aria-hidden="true"></div>' +
      header + colhead + body + guide + note + "</div>";
  },

  css: [
    /* The warm sweep of the original, with two soft lights standing in for the
       topographic texture. Both are clipped by the frame. */
    ".bd.bd-simple-winners{padding:56px 64px;background:linear-gradient(118deg,#FFD84B 0%,#FDBB2D 42%,#F7941E 100%);color:#FFFFFF;font-family:'Barlow Condensed',sans-serif;position:relative;overflow:hidden}",
    ".bd-simple-winners .sw-glow{position:absolute;border-radius:50%;opacity:0.35}",
    ".bd-simple-winners .sw-glow-a{width:760px;height:760px;right:-240px;top:-260px;background:radial-gradient(circle,#FFE98A 0%,rgba(255,233,138,0) 70%)}",
    ".bd-simple-winners .sw-glow-b{width:640px;height:640px;left:-220px;bottom:-200px;background:radial-gradient(circle,#F4801A 0%,rgba(244,128,26,0) 70%)}",

    ".bd-simple-winners .sw-head{display:flex;align-items:center;gap:30px;position:relative;flex:none}",
    ".bd-simple-winners .sw-badge{width:164px;height:164px;flex:none;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center;overflow:hidden}",
    ".bd-simple-winners .sw-badge img{width:124px;height:76px;object-fit:contain;display:block}",
    ".bd-simple-winners .sw-headtext{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-width:0}",
    ".bd-simple-winners .sw-eyebrow{font-size:28px;font-weight:700;letter-spacing:7px;color:#15233F}",
    ".bd-simple-winners .sw-title{font-family:Anton,sans-serif;font-size:58px;line-height:1;letter-spacing:0.5px;white-space:nowrap}",
    ".bd-simple-winners .sw-date{margin-top:4px;background:#15233F;color:#FFFFFF;font-size:27px;font-weight:700;letter-spacing:3px;padding:6px 22px;border-radius:10px;white-space:nowrap}",

    /* One grid shared by the column header and every row, so they stay aligned. */
    ".bd-simple-winners .sw-colhead,.bd-simple-winners .sw-row{display:grid;grid-template-columns:64px minmax(0,1fr) minmax(0,1fr) 212px 104px;align-items:center;gap:14px}",
    ".bd-simple-winners .sw-colhead{position:relative;flex:none;margin-top:34px;padding:0 26px 12px;font-size:19px;font-weight:700;letter-spacing:2.4px;color:rgba(255,255,255,0.88);white-space:nowrap}",
    ".bd-simple-winners .sw-c-reward{text-align:right}",
    ".bd-simple-winners .sw-c-meters{text-align:right}",

    ".bd-simple-winners .sw-panel{position:relative;flex:1 1 0;min-height:0;overflow:hidden;background:rgba(255,255,255,0.14);border:2px solid rgba(255,255,255,0.34);border-radius:26px;padding:0 26px}",
    ".bd-simple-winners .sw-row{border-top:1px solid rgba(255,255,255,0.22)}",
    ".bd-simple-winners .sw-row:first-child{border-top:0}",
    ".bd-simple-winners .sw-rank{font-family:Anton,sans-serif;font-size:32px;color:#FFFFFF}",
    ".bd-simple-winners .sw-name{font-weight:700;letter-spacing:0.4px;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".bd-simple-winners .sw-chip{display:inline-flex;align-items:baseline;gap:7px;padding:5px 14px;border-radius:999px;background:#FFFFFF;color:#15233F;font-size:21px;font-weight:700;letter-spacing:1.2px;white-space:nowrap}",
    ".bd-simple-winners .sw-chip b{font-family:Anton,sans-serif;font-size:25px;font-weight:400;letter-spacing:0}",
    ".bd-simple-winners .sw-meters{font-family:Anton,sans-serif;font-size:34px;color:#FFFFFF;font-variant-numeric:tabular-nums}",
    ".bd-simple-winners .sw-empty{display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:600;color:rgba(255,255,255,0.9)}",

    /* The tier guide: the original's white card and dashed divider, now three
       across so Diamond has a place. */
    ".bd-simple-winners .sw-guide{position:relative;flex:none;margin-top:26px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}",
    ".bd-simple-winners .sw-gcard{display:grid;grid-template-columns:minmax(0,1fr) 132px;align-items:stretch;background:#FFFFFF;border-radius:16px;overflow:hidden;height:112px}",
    ".bd-simple-winners .sw-gleft{display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:3px dashed #D7DBE3;padding:0 8px}",
    ".bd-simple-winners .sw-gnum{font-family:Anton,sans-serif;font-size:44px;line-height:1;color:#E35205;white-space:nowrap}",
    ".bd-simple-winners .sw-glabel{font-size:18px;font-weight:700;letter-spacing:1.2px;color:#15233F;white-space:nowrap}",
    ".bd-simple-winners .sw-gright{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;color:#15233F}",
    ".bd-simple-winners .sw-gtier{font-family:Anton,sans-serif;font-size:29px;line-height:1;white-space:nowrap}",
    ".bd-simple-winners .sw-gamt{font-size:19px;font-weight:700;letter-spacing:0.4px;white-space:nowrap}",

    ".bd-simple-winners .sw-note{position:relative;flex:none;margin-top:16px;text-align:center;font-size:24px;font-weight:600;letter-spacing:1.4px;color:#15233F}"
  ].join("\n")
});
