/* Template: Yesterday's Winners
 * The daily leaderboard. One row per crew, ranked by meters, with the tier
 * badge and the cash each member takes home.
 */
Booster.register({
  id: "winners",
  code: "D1",
  couplet: "dark",
  coupletName: "Dark",
  role: "leaderboard",
  name: "Yesterday's Winners",
  description: "The daily leaderboard. Ranks each crew by meters and shows what the Operator and Tracker each take home.",
  size: { w: 1080, h: 1350 },
  background: "#0E1419",

  fields: [
    { key: "date", type: "date", label: "Board date", default: "today",
      hint: "Post it in the morning, so this is usually yesterday." }
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
      { op: "Harpreet Singh", tr: "Mahesh Bhoi", m: 640 }
    ]
  },

  filename: function (state) {
    return "booster-winners-" + (state.values.date || Booster.todayISO()) + ".png";
  },

  /* Crews that reached a tier, best first, capped at what fits on one board. */
  eligible: function (state, config) {
    return state.rows
      .filter(function (r) { return (r.op || r.tr) && r.m > 0 && Booster.effectiveTier(r); })
      .sort(function (a, b) { return b.m - a.m; })
      .slice(0, config.maxRowsOnBoard || 12);
  },

  /* Shown under the crew list in the studio. */
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
    if (cut > 0) {
      note += " Only the top " + shown + " fit on one board, so " + cut + " more " +
        (cut === 1 ? "is" : "are") + " cut.";
    }
    return note;
  },

  render: function (state, config) {
    var esc = Booster.esc;
    var rows = this.eligible(state, config);
    var n = rows.length;

    var head = '<div class="bd-top">' +
      '<div class="bd-logo"><img src="' + esc(config.brand.logo) + '" alt="' + esc(config.brand.name) + '"></div>' +
      '<div class="bd-date">' + esc(Booster.formatDate(state.values.date)) + "</div></div>" +
      '<div class="bd-title">Yesterday’s winners.</div>';

    var body;
    if (!n) {
      body = '<div class="bd-empty">Add a crew and the board fills in here.</div>';
    } else {
      var rowH = Math.max(58, Math.min(88, Math.floor(820 / n)));
      var nameSize = rowH >= 76 ? 29 : rowH >= 66 ? 26 : 24;
      var amtSize = rowH >= 76 ? 36 : 31;
      var rankSize = rowH >= 76 ? 30 : 26;
      var markSize = rowH >= 76 ? 34 : 29;

      body = '<div class="bd-colhead">' +
        '<div style="width:92px;flex:none">RANK</div>' +
        '<div style="flex:1;min-width:0">OPERATOR</div>' +
        '<div style="flex:1;min-width:0">TRACKER</div>' +
        '<div style="width:110px;flex:none;text-align:right">METERS</div>' +
        '<div style="width:130px;flex:none;text-align:right">' + config.currency + ' EACH</div>' +
        '</div><div class="bd-rows">';

      for (var i = 0; i < n; i++) {
        var r = rows[i];
        var t = Booster.effectiveTier(r);
        var bg = t.tint ? "background:linear-gradient(90deg," + t.tint + ",rgba(0,0,0,0));" : "";
        body += '<div class="bd-row" style="height:' + rowH + "px;border-left:6px solid " + t.edge + ";" + bg + '">' +
          '<div class="bd-rank" style="font-size:' + rankSize + "px;color:" + (t.tint ? t.color : "#8D99A8") + '">' +
          "<div>" + (i + 1) + "</div>" + Booster.mark(t, markSize) + "</div>" +
          '<div class="bd-name" style="font-size:' + nameSize + 'px">' + esc(r.op || "—") + "</div>" +
          '<div class="bd-name" style="font-size:' + nameSize + 'px">' + esc(r.tr || "—") + "</div>" +
          '<div class="bd-m" style="font-size:' + (nameSize - 1) + 'px">' + r.m + " m</div>" +
          '<div class="bd-amt" style="font-size:' + amtSize + "px;color:" + t.color + '">' +
          config.currency + t.amount + "</div></div>";
      }
      body += "</div>";
    }

    var legend = '<div class="bd-legend">';
    var tiers = Booster.sortedTiers();
    for (var k = 0; k < tiers.length; k++) {
      legend += '<div class="bd-leg">' + Booster.mark(tiers[k], 32) +
        "<div>" + esc(tiers[k].name) + " <span>" + tiers[k].min + "+ m</span></div></div>";
    }
    legend += "</div>";

    return '<div class="bd bd-winners">' + head + body + legend + "</div>";
  },

  css: [
    ".bd-winners .bd-top{display:flex;align-items:center;justify-content:space-between;gap:24px}",
    ".bd-winners .bd-title{font-family:'Archivo Black',sans-serif;font-size:64px;line-height:1;letter-spacing:-0.02em;margin-top:38px}",
    ".bd-winners .bd-colhead{box-sizing:border-box;display:flex;align-items:center;gap:18px;padding-left:26px;font-size:22px;font-weight:700;letter-spacing:0.14em;color:#8D99A8;margin-top:26px;height:46px}",
    ".bd-winners .bd-row{box-sizing:border-box;display:flex;align-items:center;gap:18px;padding-left:20px;border-top:2px solid #2A333D}",
    ".bd-winners .bd-rows>.bd-row:last-child{border-bottom:2px solid #2A333D}",
    ".bd-winners .bd-rank{flex:none;display:flex;align-items:center;gap:14px;width:92px;font-weight:700}",
    ".bd-winners .bd-name{flex:1;min-width:0;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".bd-winners .bd-m{flex:none;width:110px;text-align:right;font-weight:500;color:#AEB9C6;font-variant-numeric:tabular-nums}",
    ".bd-winners .bd-amt{flex:none;width:130px;text-align:right;font-family:'Archivo Black',sans-serif;font-variant-numeric:tabular-nums}",
    ".bd-winners .bd-legend{margin-top:auto;display:flex;align-items:center;gap:30px;flex-wrap:wrap;padding-top:18px}",
    ".bd-winners .bd-leg{display:flex;align-items:center;gap:12px;font-size:25px;font-weight:700;color:#FFFFFF}",
    ".bd-winners .bd-leg span{font-weight:500;color:#AEB9C6}",
    ".bd-winners .bd-empty{margin-top:40px;border:2px dashed #2A333D;border-radius:18px;padding:60px;text-align:center;font-size:30px;color:#8D99A8;font-weight:500}"
  ].join("\n")
});
