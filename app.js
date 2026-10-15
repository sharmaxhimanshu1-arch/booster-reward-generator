/* Daily Booster Studio
 * Reads tiers.json, takes crew entries, renders the 1080x1350 winners board
 * and exports it as a PNG. Everything runs in the browser; nothing is uploaded.
 */
(function () {
  "use strict";

  var DRAFT_KEY = "booster-draft-v1";

  /* Tier marks. Each tier in tiers.json names one of these in its "mark" field.
     The shapes escalate deliberately: an outlined ring, then a solid star, then
     a faceted gem, so the climb reads even in a compressed WhatsApp image. */
  var MARKS = {
    diamond: '<svg width="W" height="W" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="M12 2.5 20.5 9 12 21.5 3.5 9z" fill="C"></path><path d="M3.5 9h17M12 2.5 8.5 9l3.5 12.5M12 2.5 15.5 9 12 21.5" fill="none" stroke="#0E1419" stroke-width="1.1" stroke-linejoin="round"></path></svg>',
    star: '<svg width="W" height="W" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="m12 2.8 2.7 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.6 3.1 1.2-6.3L2.9 9.5l6.4-.8z" fill="C"></path></svg>',
    ring: '<svg width="W" height="W" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="8.6" fill="none" stroke="C" stroke-width="2.2"></circle><circle cx="12" cy="12" r="3.4" fill="C"></circle></svg>'
  };

  /* Used only if tiers.json cannot be fetched (for example when the page is
     opened straight from the file system). The committed file always wins. */
  var FALLBACK = {
    currency: "₹",
    maxRowsOnBoard: 12,
    brand: { name: "Beckhaul Technologies", logo: "assets/beckhaul-logo.png" },
    tiers: [
      { key: "diamond", name: "Diamond", min: 1000, amount: 800, mark: "diamond", color: "#7FD8F7", edge: "#7FD8F7", tint: "rgba(127,216,247,0.14)" },
      { key: "gold", name: "Gold", min: 700, amount: 500, mark: "star", color: "#FFC20E", edge: "#FFC20E", tint: "rgba(255,194,14,0.08)" },
      { key: "silver", name: "Silver", min: 600, amount: 300, mark: "ring", color: "#C3CBD6", edge: "#4A545F", tint: "" }
    ]
  };

  var EXAMPLES = [
    { op: "Ramesh Yadav", tr: "Imran Sheikh", m: 1180 },
    { op: "Sunil Kumar", tr: "Arjun Nair", m: 920 },
    { op: "Vikas Patil", tr: "Deepak Sahu", m: 845 },
    { op: "Manoj Kumar", tr: "Rakesh Meena", m: 712 },
    { op: "Sandeep Jat", tr: "Prakash Rao", m: 690 },
    { op: "Irfan Qureshi", tr: "Santosh Gond", m: 672 },
    { op: "Ajay Chauhan", tr: "Naveen Reddy", m: 655 },
    { op: "Harpreet Singh", tr: "Mahesh Bhoi", m: 640 }
  ];

  var config = FALLBACK;
  var state = { date: todayISO(), rows: [], examples: true };

  /* ---------- helpers ---------- */

  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function todayISO() {
    var d = new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }

  function formatDate(iso) {
    var months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var p = String(iso || "").split("-");
    if (p.length !== 3) return "";
    var mi = parseInt(p[1], 10) - 1;
    if (!(mi >= 0 && mi < 12)) return "";
    return parseInt(p[2], 10) + " " + months[mi] + " " + p[0];
  }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function mark(tier, size) {
    var shape = MARKS[tier.mark] || MARKS.ring;
    return shape.replace(/W/g, String(size)).replace(/C/g, tier.color || "#C3CBD6");
  }

  function sortedTiers() {
    return config.tiers.slice().sort(function (a, b) { return b.min - a.min; });
  }

  function byKey(k) {
    for (var i = 0; i < config.tiers.length; i++) {
      if (config.tiers[i].key === k) return config.tiers[i];
    }
    return null;
  }

  function tierFor(meters) {
    var list = sortedTiers();
    for (var i = 0; i < list.length; i++) {
      if (meters >= list[i].min) return list[i];
    }
    return null;
  }

  function effectiveTier(row) {
    return row.tier ? byKey(row.tier) : (row.m > 0 ? tierFor(row.m) : null);
  }

  function qualifying() {
    var cap = config.maxRowsOnBoard || 12;
    return state.rows
      .filter(function (r) { return (r.op || r.tr) && r.m > 0 && effectiveTier(r); })
      .sort(function (a, b) { return b.m - a.m; })
      .slice(0, cap);
  }

  function $(id) { return document.getElementById(id); }

  /* ---------- draft, kept in this browser only ---------- */

  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        date: state.date, rows: state.rows, examples: state.examples
      }));
    } catch (e) { /* private window or blocked storage */ }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || !Array.isArray(d.rows)) return false;
      state.rows = d.rows;
      state.date = d.date || todayISO();
      state.examples = !!d.examples;
      return true;
    } catch (e) { return false; }
  }

  /* ---------- form ---------- */

  function renderRows() {
    var html = "";
    var list = sortedTiers();

    for (var i = 0; i < state.rows.length; i++) {
      var r = state.rows[i];
      var auto = r.m > 0 ? tierFor(r.m) : null;
      var autoLabel = auto
        ? "Auto — " + auto.name + " " + config.currency + auto.amount
        : "Auto — below target";
      var opts = '<option value="">' + esc(autoLabel) + "</option>";
      for (var j = 0; j < list.length; j++) {
        opts += '<option value="' + esc(list[j].key) + '"' +
          (r.tier === list[j].key ? " selected" : "") + ">" + esc(list[j].name) +
          " " + config.currency + list[j].amount + "</option>";
      }

      html += '<div class="row" data-i="' + i + '">' +
        '<div class="f-op"><label class="sr-only" for="op' + i + '">Operator</label>' +
        '<input id="op' + i + '" data-f="op" value="' + esc(r.op) + '" placeholder="Operator name" autocomplete="off"></div>' +
        '<div class="f-tr"><label class="sr-only" for="tr' + i + '">Tracker</label>' +
        '<input id="tr' + i + '" data-f="tr" value="' + esc(r.tr) + '" placeholder="Tracker name" autocomplete="off"></div>' +
        '<div class="f-m"><label class="sr-only" for="m' + i + '">Meters</label>' +
        '<input id="m' + i + '" data-f="m" type="number" min="0" step="1" inputmode="numeric" value="' + (r.m || "") + '" placeholder="0"></div>' +
        '<div class="f-t"><label class="sr-only" for="t' + i + '">Tier</label>' +
        '<select id="t' + i + '" data-f="tier">' + opts + "</select></div>" +
        '<button type="button" class="icon-btn" data-remove="' + i + '" aria-label="Remove row ' + (i + 1) + '">&times;</button>' +
        "</div>";
    }
    $("rows").innerHTML = html;

    var filled = state.rows.filter(function (r) { return (r.op || r.tr) && r.m > 0; });
    var below = filled.filter(function (r) { return !effectiveTier(r); }).length;
    var eligible = filled.length - below;
    var shown = qualifying().length;

    var note = shown + (shown === 1 ? " crew" : " crews") + " on the board.";
    if (below) {
      note += " " + below + " below the lowest tier, so " +
        (below === 1 ? "it is" : "they are") + " left off.";
    }
    if (eligible > shown) {
      note += " Only the top " + shown + " fit on one board, so " + (eligible - shown) + " more " +
        (eligible - shown === 1 ? "is" : "are") + " cut.";
    }
    $("rownote").textContent = note;
  }

  function renderTierRef() {
    var html = "";
    var list = sortedTiers();
    for (var i = 0; i < list.length; i++) {
      var t = list[i];
      html += '<div class="tierref">' +
        "<div>" + mark(t, 26) + "</div>" +
        '<div class="tname">' + esc(t.name) + "</div>" +
        '<div class="tmin">' + t.min + "+ m</div>" +
        '<div class="tamt">' + config.currency + t.amount + " each</div>" +
        "</div>";
    }
    $("tiers").innerHTML = html;
  }

  /* ---------- board ---------- */

  function renderBoard() {
    var rows = qualifying();
    var n = rows.length;

    var head = '<div class="bd-top">' +
      '<div class="bd-logo"><img src="' + esc(config.brand.logo) + '" alt="' + esc(config.brand.name) + '"></div>' +
      '<div class="bd-date">' + esc(formatDate(state.date)) + "</div></div>" +
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
        var t = effectiveTier(r);
        var bg = t.tint ? "background:linear-gradient(90deg," + t.tint + ",rgba(0,0,0,0));" : "";
        body += '<div class="bd-row" style="height:' + rowH + "px;border-left:6px solid " + t.edge + ";" + bg + '">' +
          '<div class="bd-rank" style="font-size:' + rankSize + "px;color:" + (t.tint ? t.color : "#8D99A8") + '">' +
          "<div>" + (i + 1) + "</div>" + mark(t, markSize) + "</div>" +
          '<div class="bd-name" style="font-size:' + nameSize + 'px">' + esc(r.op || "—") + "</div>" +
          '<div class="bd-name" style="font-size:' + nameSize + 'px">' + esc(r.tr || "—") + "</div>" +
          '<div class="bd-m" style="font-size:' + (nameSize - 1) + 'px">' + r.m + " m</div>" +
          '<div class="bd-amt" style="font-size:' + amtSize + "px;color:" + t.color + '">' +
          config.currency + t.amount + "</div></div>";
      }
      body += "</div>";
    }

    var legend = '<div class="bd-legend">';
    var list = sortedTiers();
    for (var k = 0; k < list.length; k++) {
      legend += '<div class="bd-leg">' + mark(list[k], 32) +
        "<div>" + esc(list[k].name) + " <span>" + list[k].min + "+ m</span></div></div>";
    }
    legend += "</div>";

    $("board").innerHTML = '<div class="bd">' + head + body + legend + "</div>";
    fitStage();
  }

  function fitStage() {
    var stage = $("stage");
    var board = $("board");
    var w = stage.clientWidth;
    if (!w) return;
    var k = w / 1080;
    board.style.transform = "scale(" + k + ")";
    stage.style.height = Math.round(1350 * k) + "px";
  }

  function refresh() {
    renderRows();
    renderBoard();
    saveDraft();
  }

  /* ---------- events ---------- */

  function hideBanner() { $("examplebanner").hidden = true; }

  $("rows").addEventListener("input", function (e) {
    var f = e.target.getAttribute("data-f");
    if (!f) return;
    var i = parseInt(e.target.closest(".row").getAttribute("data-i"), 10);
    if (f === "m") {
      state.rows[i].m = parseInt(e.target.value, 10) || 0;
      renderRows();
    } else {
      state.rows[i][f] = e.target.value;
    }
    renderBoard();
    saveDraft();
  });

  $("rows").addEventListener("change", function (e) {
    if (e.target.getAttribute("data-f") !== "tier") return;
    var i = parseInt(e.target.closest(".row").getAttribute("data-i"), 10);
    state.rows[i].tier = e.target.value || null;
    refresh();
  });

  $("rows").addEventListener("click", function (e) {
    var idx = e.target.getAttribute("data-remove");
    if (idx === null) return;
    state.rows.splice(parseInt(idx, 10), 1);
    refresh();
  });

  $("addrow").addEventListener("click", function () {
    if (state.examples) { state.rows = []; state.examples = false; hideBanner(); }
    state.rows.push({ op: "", tr: "", m: 0, tier: null });
    refresh();
    var inputs = document.querySelectorAll('#rows input[data-f="op"]');
    if (inputs.length) inputs[inputs.length - 1].focus();
  });

  $("sortrows").addEventListener("click", function () {
    state.rows.sort(function (a, b) { return (b.m || 0) - (a.m || 0); });
    refresh();
  });

  $("clearexamples").addEventListener("click", function () {
    state.rows = [{ op: "", tr: "", m: 0, tier: null }];
    state.examples = false;
    hideBanner();
    refresh();
  });

  $("boarddate").addEventListener("change", function (e) {
    state.date = e.target.value || todayISO();
    $("datenote").textContent = "Board shows " + formatDate(state.date) + ".";
    renderBoard();
    saveDraft();
  });

  /* ---------- download ---------- */

  $("download").addEventListener("click", function () {
    var status = $("status");
    var btn = this;

    if (!qualifying().length) {
      status.textContent = "Add at least one crew before downloading.";
      return;
    }

    status.textContent = "Rendering…";
    btn.disabled = true;

    Promise.resolve(document.fonts && document.fonts.ready).then(function () {
      var holder = document.createElement("div");
      holder.style.cssText = "position:fixed;left:-20000px;top:0;width:1080px;height:1350px;";
      holder.appendChild($("board").firstChild.cloneNode(true));
      document.body.appendChild(holder);

      return html2canvas(holder.firstChild, {
        width: 1080,
        height: 1350,
        scale: 1,
        backgroundColor: "#0E1419",
        useCORS: true,
        logging: false
      }).then(function (canvas) {
        holder.remove();
        return new Promise(function (res) { canvas.toBlob(res, "image/png"); });
      }, function (err) {
        holder.remove();
        throw err;
      });
    }).then(function (blob) {
      if (!blob) throw new Error("render failed");
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "booster-winners-" + state.date + ".png";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
      status.textContent = "Saved to your downloads. Send it to the crew group.";
    }).catch(function () {
      status.textContent = "Could not build the image. Reload the page and try again.";
    }).then(function () {
      btn.disabled = false;
    });
  });

  window.addEventListener("resize", fitStage);

  /* ---------- start ---------- */

  function start() {
    if (!loadDraft()) {
      state.rows = EXAMPLES.map(function (e) {
        return { op: e.op, tr: e.tr, m: e.m, tier: null };
      });
      state.examples = true;
    }
    if (!state.examples) hideBanner();

    $("boarddate").value = state.date;
    $("datenote").textContent = "Board shows " + formatDate(state.date) + ".";
    renderTierRef();
    refresh();
  }

  fetch("tiers.json", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error("tiers.json " + res.status);
      return res.json();
    })
    .then(function (json) {
      if (json && Array.isArray(json.tiers) && json.tiers.length) {
        config = {
          currency: json.currency || FALLBACK.currency,
          maxRowsOnBoard: json.maxRowsOnBoard || FALLBACK.maxRowsOnBoard,
          brand: json.brand || FALLBACK.brand,
          tiers: json.tiers
        };
      }
    })
    .catch(function () {
      /* Keep the built-in tiers; the page still works offline or from file://. */
    })
    .then(start);
})();
