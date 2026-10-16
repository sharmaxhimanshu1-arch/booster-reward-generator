/* Template: Winners Podium
 * The leaderboard in the bright brand style: the top three crews as podium
 * cards, ranks 4-10 in a navy table, and the tier guide along the bottom.
 */
Booster.register({
  id: "podium",
  couplet: "yellow",
  coupletName: "Yellow",
  role: "leaderboard",
  name: "Winners Podium",
  description: "The leaderboard in the yellow brand style. Top three crews on a podium, the rest in a table, with the tier guide below.",
  size: { w: 1080, h: 1350 },
  background: "#FFC42E",

  fields: [
    { key: "date", type: "date", label: "Board date", default: "today",
      hint: "Post it in the morning, so this is usually yesterday." },
    { key: "kicker", type: "text", label: "Kicker", default: "TOP 10 CREWS BY METERS" }
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
    return "booster-podium-" + (state.values.date || Booster.todayISO()) + ".png";
  },

  /* The podium takes three and the table holds seven, so this board is a
     top ten however many crews are typed in. */
  eligible: function (state) {
    return state.rows
      .filter(function (r) { return (r.op || r.tr) && r.m > 0 && Booster.effectiveTier(r); })
      .sort(function (a, b) { return b.m - a.m; })
      .slice(0, 10);
  },

  status: function (state) {
    var filled = state.rows.filter(function (r) { return (r.op || r.tr) && r.m > 0; });
    var below = filled.filter(function (r) { return !Booster.effectiveTier(r); }).length;
    var shown = this.eligible(state).length;
    var cut = (filled.length - below) - shown;

    var note = shown + (shown === 1 ? " crew" : " crews") + " on the board.";
    if (shown && shown < 3) note += " The podium wants three, so the empty places are left out.";
    if (below) {
      note += " " + below + " below the lowest tier, so " +
        (below === 1 ? "it is" : "they are") + " left off.";
    }
    if (cut > 0) note += " This board holds ten, so " + cut + " more " + (cut === 1 ? "is" : "are") + " cut.";
    return note;
  },

  render: function (state, config) {
    var esc = Booster.esc;
    var cur = config.currency;
    var all = this.eligible(state);

    var ranked = all.map(function (r, i) {
      var t = Booster.effectiveTier(r);
      return {
        rank: i + 1,
        op: r.op || "—",
        tr: r.tr || "—",
        m: r.m,
        label: String(t.name).toUpperCase(),
        reward: t.amount,
        color: t.color
      };
    });

    function pill(c) {
      return "display:inline-block;font-weight:800;font-size:19px;letter-spacing:1.2px;" +
        "padding:5px 12px;border-radius:999px;color:#15143B;white-space:nowrap;background:" + c;
    }

    /* ---- header ---- */
    var header = '<div class="pd-head">' +
      '<div class="pd-logo"><img src="' + esc(config.brand.logo) + '" alt="' + esc(config.brand.name) + '"></div>' +
      '<div class="pd-headtext">' +
      '<div class="pd-eyebrow">DAILY BOOSTER</div>' +
      '<div class="pd-title">YESTERDAY’S WINNERS</div>' +
      '<div class="pd-meta"><div class="pd-date">' + esc(Booster.formatDate(state.values.date)) + "</div>" +
      '<div class="pd-kicker">' + esc(state.values.kicker) + "</div></div>" +
      "</div></div>";

    /* ---- podium: second, first, third, so the winner stands in the middle ---- */
    var top3 = ranked.slice(0, 3);
    var order = [top3[1], top3[0], top3[2]].filter(Boolean);

    var podium = '<div class="pd-podium">' + order.map(function (p) {
      var isTop = p.rank === 1;
      return '<div class="pd-card" style="height:' + (isTop ? 350 : 312) + "px;" +
        (isTop ? "outline:5px solid " + p.color + ";outline-offset:-5px;" : "") + '">' +
        '<div class="pd-cardtop">' +
        '<div class="pd-disc" style="background:' + p.color + '">' + p.rank + "</div>" +
        (isTop ? '<div class="pd-topcrew" style="color:' + p.color + '">TOP CREW</div>' : "") +
        "</div>" +
        '<div class="pd-names">' +
        '<div class="pd-nameline"><span class="pd-role">OP</span><span class="pd-name">' + esc(p.op) + "</span></div>" +
        '<div class="pd-nameline"><span class="pd-role">TR</span><span class="pd-name">' + esc(p.tr) + "</span></div>" +
        "</div>" +
        '<div class="pd-meters"><div class="pd-mnum">' + p.m + '</div><div class="pd-munit">METERS</div></div>' +
        '<div><span style="' + pill(p.color) + '">' + esc(p.label) + " · " + cur + p.reward + " EACH</span></div>" +
        "</div>";
    }).join("") + "</div>";

    /* ---- table for the rest ---- */
    var rest = ranked.slice(3, 10);
    var table = '<div class="pd-table">' +
      '<div class="pd-thead"><div>RANK</div><div>OPERATOR</div><div>TRACKER</div>' +
      '<div style="text-align:right">METERS</div><div style="text-align:right">REWARD EACH</div></div>' +
      (rest.length
        ? rest.map(function (r) {
            return '<div class="pd-trow">' +
              '<div class="pd-trank">' + r.rank + "</div>" +
              '<div class="pd-tname">' + esc(r.op) + "</div>" +
              '<div class="pd-tname">' + esc(r.tr) + "</div>" +
              '<div class="pd-tm">' + r.m + "</div>" +
              '<div style="text-align:right"><span style="' + pill(r.color) + '">' +
              esc(r.label) + " · " + cur + r.reward + "</span></div></div>";
          }).join("")
        : '<div class="pd-tempty">Ranks four and below appear here.</div>') +
      "</div>";

    /* ---- tier guide ---- */
    var guide = '<div class="pd-guide">' + Booster.sortedTiers().map(function (t) {
      return '<div class="pd-gcard">' +
        '<div class="pd-gchip" style="background:' + t.color + '">' + esc(String(t.name).toUpperCase()) + "</div>" +
        '<div class="pd-gnum"><span>' + t.min + "+</span> METERS / DAY</div>" +
        '<div class="pd-gsub">' + cur + t.amount + " each · Operator &amp; Tracker</div></div>";
    }).join("") + "</div>";

    return '<div class="bd bd-podium">' +
      '<div class="pd-blob pd-blob-a" aria-hidden="true"></div>' +
      '<div class="pd-blob pd-blob-b" aria-hidden="true"></div>' +
      header + podium + table + guide + "</div>";
  },

  css: [
    ".bd.bd-podium{padding:52px 64px;background:#FFC42E;color:#15143B;font-family:'Barlow Condensed',sans-serif;gap:24px;position:relative;overflow:hidden}",
    ".bd-podium .pd-blob{position:absolute;border-radius:50%;background:#FFB21A}",
    ".bd-podium .pd-blob-a{right:-180px;top:-180px;width:520px;height:520px}",
    ".bd-podium .pd-blob-b{left:-140px;bottom:-160px;width:420px;height:420px}",

    ".bd-podium .pd-head{display:flex;align-items:center;gap:32px;position:relative;flex:none}",
    ".bd-podium .pd-logo{background:#FFFFFF;border-radius:18px;padding:8px 14px;box-shadow:0 6px 0 #15143B;flex-shrink:0;display:flex}",
    ".bd-podium .pd-logo img{width:210px;height:130px;object-fit:contain;display:block}",
    ".bd-podium .pd-headtext{display:flex;flex-direction:column;gap:6px;min-width:0}",
    ".bd-podium .pd-eyebrow{font-weight:800;font-size:26px;letter-spacing:8px}",
    ".bd-podium .pd-title{font-family:Anton,sans-serif;font-size:72px;line-height:0.95;letter-spacing:1px;white-space:nowrap}",
    ".bd-podium .pd-meta{display:flex;align-items:center;gap:16px;margin-top:8px}",
    ".bd-podium .pd-date{background:#15143B;color:#FFFFFF;font-weight:700;font-size:26px;letter-spacing:2px;padding:5px 16px;border-radius:8px;white-space:nowrap}",
    ".bd-podium .pd-kicker{font-weight:700;font-size:22px;letter-spacing:3px}",

    ".bd-podium .pd-podium{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;align-items:end;position:relative;flex:none}",
    ".bd-podium .pd-card{background:#15143B;border-radius:22px;padding:20px 22px;display:flex;flex-direction:column;justify-content:space-between;gap:12px;box-sizing:border-box;min-width:0}",
    ".bd-podium .pd-cardtop{display:flex;align-items:center;justify-content:space-between}",
    ".bd-podium .pd-disc{width:56px;height:56px;border-radius:50%;color:#15143B;display:flex;align-items:center;justify-content:center;font-family:Anton,sans-serif;font-size:32px}",
    ".bd-podium .pd-topcrew{font-weight:800;font-size:18px;letter-spacing:2px}",
    ".bd-podium .pd-names{display:flex;flex-direction:column;gap:4px;min-width:0}",
    ".bd-podium .pd-nameline{display:flex;align-items:baseline;gap:8px;min-width:0}",
    ".bd-podium .pd-role{font-weight:700;font-size:15px;letter-spacing:2px;color:#AEB5D6;flex-shrink:0;width:26px}",
    ".bd-podium .pd-name{font-family:Anton,sans-serif;font-size:29px;line-height:1.15;color:#FFFFFF;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".bd-podium .pd-meters{display:flex;align-items:baseline;gap:6px}",
    ".bd-podium .pd-mnum{font-family:Anton,sans-serif;font-size:64px;line-height:1;color:#FFFFFF}",
    ".bd-podium .pd-munit{font-weight:700;font-size:24px;color:#AEB5D6}",

    ".bd-podium .pd-table{flex:1 1 0;min-height:0;overflow:hidden;background:#15143B;border-radius:22px;padding:12px 28px 8px;display:flex;flex-direction:column;position:relative}",
    ".bd-podium .pd-thead,.bd-podium .pd-trow{display:grid;grid-template-columns:48px 1fr 1fr 92px 196px;column-gap:12px;align-items:center}",
    ".bd-podium .pd-thead{padding:6px 0 10px;font-weight:700;font-size:18px;letter-spacing:3px;color:#AEB5D6}",
    ".bd-podium .pd-trow{flex:1 1 0;min-height:0;border-top:1px solid rgba(255,255,255,0.14)}",
    ".bd-podium .pd-trank{font-family:Anton,sans-serif;font-size:28px;color:#AEB5D6}",
    ".bd-podium .pd-tname{font-weight:700;font-size:28px;letter-spacing:0.5px;color:#FFFFFF;text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".bd-podium .pd-tm{font-family:Anton,sans-serif;font-size:30px;color:#FFFFFF;text-align:right}",
    ".bd-podium .pd-tempty{flex-grow:1;display:flex;align-items:center;justify-content:center;color:#AEB5D6;font-size:26px;font-weight:600}",

    ".bd-podium .pd-guide{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px;position:relative;flex:none}",
    ".bd-podium .pd-gcard{background:#FFFFFF;border-radius:16px;padding:14px 20px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;box-shadow:0 5px 0 #15143B}",
    ".bd-podium .pd-gchip{color:#15143B;font-weight:800;font-size:19px;letter-spacing:1.5px;padding:4px 12px;border-radius:999px}",
    ".bd-podium .pd-gnum{font-family:Anton,sans-serif;font-size:27px;line-height:1.1;white-space:nowrap}",
    ".bd-podium .pd-gnum span{color:#E05300}",
    ".bd-podium .pd-gsub{font-weight:600;font-size:20px;color:#3B3A5C}"
  ].join("\n")
});
