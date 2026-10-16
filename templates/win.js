/* Template: Win Cash Rewards
 * The standing poster in the bright brand style: a big WIN, then one row per
 * tier showing the meters, what each crew member takes home, and the tier name.
 */
Booster.register({
  id: "win",
  code: "Y2",
  couplet: "yellow",
  coupletName: "Yellow",
  role: "rewards",
  name: "Win Cash Rewards",
  description: "The tier poster in the yellow brand style. A big WIN, then a row per tier with the meters and the cash each.",
  size: { w: 1080, h: 1350 },
  background: "#FFC42E",

  fields: [
    { key: "eyebrow", type: "text", label: "Eyebrow", default: "DAILY" },
    { key: "word1", type: "text", label: "Wordmark line 1", default: "BOOSTER" },
    { key: "word2", type: "text", label: "Wordmark line 2", default: "REWARDS" },
    { key: "headline", type: "text", label: "Headline", default: "Hit your daily meters target" },
    { key: "big", type: "text", label: "Big word", default: "WIN",
      hint: "Three or four letters hold their size. Longer text is shrunk to fit." },
    { key: "ribbon", type: "text", label: "Ribbon", default: "CASH REWARDS" },
    { key: "foot", type: "text", label: "Footer bar",
      default: "OPERATOR & TRACKER EACH TAKE HOME THE FULL AMOUNT" }
  ],

  rows: null,

  filename: function () { return "booster-win-rewards.png"; },

  render: function (state, config) {
    var esc = Booster.esc;
    var v = state.values;
    var cur = config.currency;

    var big = String(v.big == null ? "" : v.big);
    var bigSize = big.length <= 4 ? 190 : big.length <= 7 ? 130 : 92;

    var header = '<div class="wn-head">' +
      '<div class="wn-logo"><img src="' + esc(config.brand.logo) + '" alt="' + esc(config.brand.name) + '"></div>' +
      '<div class="wn-wordmark">' +
      '<div class="wn-eyebrow">' + esc(v.eyebrow) + "</div>" +
      '<div class="wn-w1">' + esc(v.word1) + "</div>" +
      '<div class="wn-w2">' + esc(v.word2) + "</div></div></div>";

    var hero = '<div class="wn-hero">' +
      '<div class="wn-headline">' + esc(v.headline) + "</div>" +
      '<div class="wn-big" style="font-size:' + bigSize + 'px">' + esc(big) + "</div>" +
      '<div class="wn-ribbon">' + esc(v.ribbon) + "</div></div>";

    var tiers = '<div class="wn-tiers">' + Booster.sortedTiers().map(function (t, i) {
      return '<div class="wn-row">' +
        '<div class="wn-meters"><div class="wn-mnum">' + t.min + '+</div>' +
        '<div class="wn-munit">METERS / DAY</div></div>' +
        '<div class="wn-win"><div class="wn-winlabel">YOU WIN</div>' +
        '<div class="wn-pay"><span>Operator</span><span>' + cur + t.amount + "</span></div>" +
        '<div class="wn-pay"><span>Tracker</span><span>' + cur + t.amount + "</span></div></div>" +
        '<div class="wn-block" style="background:' + t.color + '">' +
        '<div class="wn-blabel">' + esc(String(t.name).toUpperCase()) + "</div>" +
        '<div class="wn-bsub">' + (i === 0 ? "ELITE TIER" : "TIER") + "</div></div></div>";
    }).join("") + "</div>";

    var foot = '<div class="wn-foot"><span>' + esc(v.foot) + "</span></div>";

    return '<div class="bd bd-win">' + header +
      '<div class="wn-body">' + hero + tiers + "</div>" + foot + "</div>";
  },

  css: [
    ".bd.bd-win{padding:56px 64px 84px;background:repeating-conic-gradient(from 0deg at 50% 42%,#FFC42E 0deg 9deg,#FFB81C 9deg 18deg);color:#15143B;font-family:'Barlow Condensed',sans-serif;position:relative;overflow:hidden}",

    ".bd-win .wn-head{display:flex;align-items:center;justify-content:space-between;height:146px;flex:none}",
    ".bd-win .wn-logo{background:#FFFFFF;border-radius:18px;padding:8px 14px;box-shadow:0 6px 0 #15143B;display:flex}",
    ".bd-win .wn-logo img{width:200px;height:124px;object-fit:contain;display:block}",
    ".bd-win .wn-wordmark{display:flex;flex-direction:column;align-items:flex-end;justify-content:center;height:146px}",
    ".bd-win .wn-eyebrow{font-weight:800;font-size:24px;letter-spacing:8px;line-height:1}",
    ".bd-win .wn-w1{font-family:Anton,sans-serif;font-size:66px;line-height:1;color:#FFFFFF;text-shadow:4px 4px 0 #15143B}",
    ".bd-win .wn-w2{font-family:Anton,sans-serif;font-size:52px;line-height:0.95}",

    ".bd-win .wn-body{flex-grow:1;display:flex;flex-direction:column;justify-content:space-evenly;min-height:0}",
    ".bd-win .wn-hero{display:flex;flex-direction:column;align-items:center;gap:18px;flex:none;min-height:0}",
    ".bd-win .wn-headline{text-align:center;font-weight:800;font-size:56px;line-height:1;letter-spacing:0.5px;max-width:100%}",
    /* The outline is drawn with text-shadow rather than -webkit-text-stroke,
       which the PNG renderer ignores. Eight rings make the edge, the straight
       drops make the extrusion. */
    ".bd-win .wn-big{font-family:Anton,sans-serif;line-height:0.95;color:#FF6A13;letter-spacing:8px;text-align:center;text-shadow:-4px -4px 0 #15143B,4px -4px 0 #15143B,-4px 4px 0 #15143B,4px 4px 0 #15143B,-5px 0 0 #15143B,5px 0 0 #15143B,0 -5px 0 #15143B,0 5px 0 #15143B,0 8px 0 #15143B,0 11px 0 #15143B,0 14px 0 #15143B,0 17px 0 #15143B}",
    ".bd-win .wn-ribbon{margin-top:6px;background:#15143B;color:#FFFFFF;font-family:Anton,sans-serif;font-size:38px;letter-spacing:6px;padding:4px 28px;border-radius:10px}",

    ".bd-win .wn-tiers{display:flex;flex-direction:column;gap:20px;flex:none}",
    ".bd-win .wn-row{display:grid;grid-template-columns:260px 1fr 260px;background:#FFFFFF;border-radius:20px;overflow:hidden;box-shadow:0 6px 0 #15143B;height:136px}",
    ".bd-win .wn-meters{display:flex;flex-direction:column;align-items:center;justify-content:center}",
    ".bd-win .wn-mnum{font-family:Anton,sans-serif;font-size:68px;line-height:1;color:#E05300}",
    ".bd-win .wn-munit{font-weight:700;font-size:22px;letter-spacing:2px}",
    ".bd-win .wn-win{display:flex;flex-direction:column;justify-content:center;gap:2px;padding:0 36px;border-left:3px dashed #C9CCD8}",
    ".bd-win .wn-winlabel{font-weight:700;font-size:20px;letter-spacing:3px;color:#4A4968}",
    ".bd-win .wn-pay{display:flex;justify-content:space-between;font-weight:700;font-size:31px}",
    ".bd-win .wn-block{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#15143B}",
    ".bd-win .wn-blabel{font-family:Anton,sans-serif;font-size:52px;line-height:1}",
    ".bd-win .wn-bsub{font-weight:800;font-size:22px;letter-spacing:5px}",

    ".bd-win .wn-foot{position:absolute;left:0;right:0;bottom:0;height:84px;background:#15143B;color:#FFFFFF;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:26px;letter-spacing:2px;text-align:center;padding:0 40px}"
  ].join("\n")
});
