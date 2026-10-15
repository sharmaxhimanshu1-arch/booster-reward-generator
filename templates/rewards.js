/* Template: Booster Rewards
 * The standing poster that explains the tiers. It reads the thresholds and
 * amounts from tiers.json, so it can never drift from the winners board.
 */
Booster.register({
  id: "rewards",
  name: "Booster Rewards",
  description: "The standing poster explaining the tiers. Thresholds and amounts come straight from tiers.json.",
  size: { w: 1080, h: 1350 },
  background: "#0E1419",

  fields: [
    { key: "eyebrow", type: "text", label: "Eyebrow", default: "DAILY BOOSTER" },
    { key: "headline", type: "textarea", label: "Headline", default: "Hit your daily\nmeters target.",
      hint: "One line per line break." },
    { key: "sub", type: "text", label: "Sub-line", default: "Climb the tiers. Operator and Tracker each take home the full amount." },
    { key: "foot", type: "text", label: "Footnote", default: "Meters count only for inspected, incident-free work." },
    { key: "elite", type: "text", label: "Top tier badge", default: "ELITE",
      hint: "Shown beside the highest tier. Leave empty for none." }
  ],

  rows: null,

  filename: function () { return "booster-rewards.png"; },

  render: function (state, config) {
    var esc = Booster.esc;
    var v = state.values;
    var tiers = Booster.sortedTiers();

    var head = '<div class="bd-top">' +
      '<div class="bd-logo"><img src="' + esc(config.brand.logo) + '" alt="' + esc(config.brand.name) + '"></div>' +
      '<div class="rw-eyebrow">' + esc(v.eyebrow) + "</div></div>";

    var headline = String(v.headline == null ? "" : v.headline).split("\n").map(esc).join("<br>");
    var intro = '<div class="rw-headline">' + headline + "</div>" +
      '<div class="rw-sub">' + esc(v.sub) + "</div>";

    var body = '<div class="rw-tiers">';
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var top = i === 0;
      var bg = t.tint ? "background:linear-gradient(90deg," + t.tint + ",rgba(0,0,0,0));" : "";
      var badge = (top && v.elite)
        ? '<div class="rw-pill" style="background:' + t.color + '">' + esc(v.elite) + "</div>"
        : "";

      body += '<div class="rw-tier" style="border-left:6px solid ' + t.edge + ";" + bg + '">' +
        Booster.mark(t, 76) +
        '<div class="rw-meta">' +
        '<div class="rw-labelrow"><div class="rw-label" style="color:' + t.color + '">' +
        esc(t.name).toUpperCase() + "</div>" + badge + "</div>" +
        '<div class="rw-num">' + t.min + "+</div>" +
        '<div class="rw-unit">METERS PER DAY</div></div>' +
        '<div class="rw-amt">' + config.currency + t.amount + "</div></div>";
    }
    body += "</div>";

    var foot = '<div class="rw-foot">' + esc(v.foot) + "</div>";

    return '<div class="bd bd-rewards">' + head + intro + body + foot + "</div>";
  },

  css: [
    ".bd-rewards .bd-top{display:flex;align-items:center;justify-content:space-between;gap:24px}",
    ".bd-rewards .rw-eyebrow{font-size:26px;font-weight:700;letter-spacing:0.26em;color:#FFC20E;text-align:right}",
    ".bd-rewards .rw-headline{margin-top:52px;font-family:'Archivo Black',sans-serif;font-size:96px;line-height:0.98;letter-spacing:-0.02em}",
    ".bd-rewards .rw-sub{margin-top:24px;font-size:34px;font-weight:500;line-height:1.25;color:#AEB9C6}",
    ".bd-rewards .rw-tiers{margin-top:52px;display:flex;flex-direction:column}",
    ".bd-rewards .rw-tier{height:196px;box-sizing:border-box;display:flex;align-items:center;gap:30px;padding-left:24px;border-top:2px solid #2A333D}",
    ".bd-rewards .rw-tier:last-child{border-bottom:2px solid #2A333D}",
    ".bd-rewards .rw-meta{flex:1;display:flex;flex-direction:column;gap:6px}",
    ".bd-rewards .rw-labelrow{display:flex;align-items:center;gap:14px}",
    ".bd-rewards .rw-label{font-size:26px;font-weight:700;letter-spacing:0.22em}",
    ".bd-rewards .rw-pill{font-size:20px;font-weight:700;letter-spacing:0.16em;color:#0E1419;border-radius:999px;padding:5px 14px}",
    ".bd-rewards .rw-num{font-family:'Archivo Black',sans-serif;font-size:68px;line-height:1;letter-spacing:-0.02em}",
    ".bd-rewards .rw-unit{font-size:26px;font-weight:700;letter-spacing:0.08em;color:#AEB9C6}",
    ".bd-rewards .rw-amt{flex:none;text-align:right;font-family:'Archivo Black',sans-serif;font-size:106px;line-height:1;letter-spacing:-0.03em}",
    ".bd-rewards .rw-foot{margin-top:auto;font-size:28px;font-weight:500;line-height:1.3;color:#8D99A8;padding-top:18px}"
  ].join("\n")
});
