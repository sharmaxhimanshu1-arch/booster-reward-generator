/* Template: Simple Rewards
 *
 * The companion poster: sunburst, the WIN lockup, and one full-width card per
 * tier with the original's dashed dividers.
 *
 * What the first draft was missing, and what this adds:
 *   - the Diamond tier, which was drawn nowhere
 *   - "+" on the thresholds, so 650 m is clearly Silver and not a near miss
 *   - a tier colour behind each tier name, so the three read apart at a glance
 *   - the amounts come from tiers.json, so the poster cannot drift out of step
 */
Booster.register({
  id: "simple-rewards",
  name: "Simple Rewards",
  description: "The sunburst poster. A big WIN, then one card per tier with the meters and what each crew member takes home.",
  size: { w: 1080, h: 1350 },
  background: "#FFC72C",

  fields: [
    { key: "word1", type: "text", label: "Wordmark line 1", default: "BOOSTER" },
    { key: "word2", type: "text", label: "Wordmark line 2", default: "REWARDS" },
    { key: "headline", type: "text", label: "Headline", default: "Hit your daily meters target" },
    { key: "big", type: "text", label: "Big word", default: "WIN",
      hint: "Three or four letters hold their size. Longer text is shrunk to fit." },
    { key: "ribbon", type: "text", label: "Ribbon under it", default: "REWARDS" },
    { key: "foot", type: "text", label: "Footer line",
      default: "Operator and Tracker each take home the full amount." }
  ],

  rows: null,

  filename: function () { return "booster-rewards.png"; },

  render: function (state, config) {
    var esc = Booster.esc;
    var v = state.values;
    var cur = config.currency;

    var big = String(v.big == null ? "" : v.big);
    var bigSize = big.length <= 4 ? 196 : big.length <= 7 ? 134 : 94;

    var header = '<div class="sr-head">' +
      '<div class="sr-badge"><img src="' + esc(config.brand.logo) + '" alt="' + esc(config.brand.name) + '"></div>' +
      '<div class="sr-wordmark">' +
      '<div class="sr-w1">' + esc(v.word1) + "</div>" +
      '<div class="sr-w2">' + esc(v.word2) + "</div></div></div>";

    var hero = '<div class="sr-hero">' +
      '<div class="sr-headline">' + esc(v.headline) + "</div>" +
      '<div class="sr-big" style="font-size:' + bigSize + 'px">' + esc(big) + "</div>" +
      '<div class="sr-ribbon">' + esc(v.ribbon) + "</div></div>";

    /* One card per tier: meters, what each member wins, then the tier itself —
       the three segments of the original, divided by its dashed rules. */
    var cards = '<div class="sr-cards">' + Booster.sortedTiers().map(function (t) {
      return '<div class="sr-card">' +
        '<div class="sr-meters"><div class="sr-mnum">' + t.min + "+</div>" +
        '<div class="sr-munit">METERS / DAY</div></div>' +
        '<div class="sr-win"><div class="sr-winword">Win</div>' +
        '<div class="sr-pay"><span>OPERATOR</span><span>' + cur + t.amount + "</span></div>" +
        '<div class="sr-pay"><span>TRACKER</span><span>' + cur + t.amount + "</span></div></div>" +
        '<div class="sr-tier" style="background:' + t.color + '">' +
        '<div class="sr-tname">' + esc(t.name) + "</div>" +
        '<div class="sr-tword">TIER</div></div></div>';
    }).join("") + "</div>";

    var foot = '<div class="sr-foot">' + esc(v.foot) + "</div>";

    return '<div class="bd bd-simple-rewards">' + header + hero + cards + foot + "</div>";
  },

  css: [
    /* The sunburst of the original, struck from just above the WIN. */
    ".bd.bd-simple-rewards{padding:52px 64px 46px;background:repeating-conic-gradient(from 0deg at 50% 38%,#FFC72C 0deg 7.5deg,#FFD866 7.5deg 15deg);color:#15233F;font-family:'Barlow Condensed',sans-serif;position:relative;overflow:hidden}",

    ".bd-simple-rewards .sr-head{display:flex;align-items:center;justify-content:space-between;gap:24px;flex:none}",
    ".bd-simple-rewards .sr-badge{width:156px;height:156px;flex:none;border-radius:50%;background:#FFFFFF;display:flex;align-items:center;justify-content:center;overflow:hidden}",
    ".bd-simple-rewards .sr-badge img{width:118px;height:72px;object-fit:contain;display:block}",
    ".bd-simple-rewards .sr-wordmark{display:flex;flex-direction:column;align-items:flex-end}",
    ".bd-simple-rewards .sr-w1{font-family:Anton,sans-serif;font-size:72px;line-height:1;color:#FFFFFF;text-shadow:3px 3px 0 #15233F}",
    ".bd-simple-rewards .sr-w2{font-family:Anton,sans-serif;font-size:58px;line-height:1.05;color:#15233F}",

    ".bd-simple-rewards .sr-hero{flex:1 1 0;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px}",
    ".bd-simple-rewards .sr-headline{text-align:center;font-family:'Archivo',sans-serif;font-size:54px;font-weight:700;line-height:1.1;letter-spacing:-0.01em;max-width:100%}",
    /* The lockup's outline and extrusion are drawn with text-shadow, which the
       PNG renderer supports; -webkit-text-stroke would be dropped. */
    ".bd-simple-rewards .sr-big{font-family:Anton,sans-serif;line-height:0.95;color:#F26A21;letter-spacing:6px;text-align:center;text-shadow:-4px -4px 0 #2E1A47,4px -4px 0 #2E1A47,-4px 4px 0 #2E1A47,4px 4px 0 #2E1A47,0 -5px 0 #2E1A47,0 5px 0 #2E1A47,-5px 0 0 #2E1A47,5px 0 0 #2E1A47,6px 9px 0 #2E1A47,9px 13px 0 #2E1A47,12px 17px 0 #2E1A47,15px 21px 0 #2E1A47}",
    ".bd-simple-rewards .sr-ribbon{font-family:Anton,sans-serif;font-size:40px;letter-spacing:5px;color:#FFFFFF;text-shadow:-3px -3px 0 #2E1A47,3px -3px 0 #2E1A47,-3px 3px 0 #2E1A47,3px 3px 0 #2E1A47,0 -3px 0 #2E1A47,0 3px 0 #2E1A47,-3px 0 0 #2E1A47,3px 0 0 #2E1A47}",

    ".bd-simple-rewards .sr-cards{flex:none;display:flex;flex-direction:column;gap:18px}",
    ".bd-simple-rewards .sr-card{display:grid;grid-template-columns:270px minmax(0,1fr) 230px;align-items:stretch;background:#FFFFFF;border-radius:18px;overflow:hidden;height:150px}",
    ".bd-simple-rewards .sr-meters{display:flex;flex-direction:column;align-items:center;justify-content:center;border-right:3px dashed #D7DBE3}",
    ".bd-simple-rewards .sr-mnum{font-family:Anton,sans-serif;font-size:62px;line-height:1;color:#E35205}",
    ".bd-simple-rewards .sr-munit{font-size:22px;font-weight:700;letter-spacing:2px}",
    ".bd-simple-rewards .sr-win{display:flex;flex-direction:column;justify-content:center;gap:1px;padding:0 34px;border-right:3px dashed #D7DBE3}",
    ".bd-simple-rewards .sr-winword{font-family:Anton,sans-serif;font-size:38px;line-height:1.05;text-align:center}",
    ".bd-simple-rewards .sr-pay{display:flex;justify-content:space-between;gap:16px;font-size:25px;font-weight:700;letter-spacing:1px}",
    ".bd-simple-rewards .sr-pay span:last-child{font-family:Anton,sans-serif;font-size:27px;letter-spacing:0}",
    ".bd-simple-rewards .sr-tier{display:flex;flex-direction:column;align-items:center;justify-content:center;color:#15233F}",
    ".bd-simple-rewards .sr-tname{font-family:Anton,sans-serif;font-size:44px;line-height:1}",
    ".bd-simple-rewards .sr-tword{font-size:22px;font-weight:700;letter-spacing:4px}",

    ".bd-simple-rewards .sr-foot{flex:none;margin-top:18px;text-align:center;font-size:25px;font-weight:600;letter-spacing:0.8px;color:#15233F}"
  ].join("\n")
});
