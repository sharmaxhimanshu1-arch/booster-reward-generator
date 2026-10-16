/* Booster core
 *
 * Shared machinery for every creative template: the template registry, the
 * tier config from tiers.json, the tier badges, preview scaling and PNG export.
 *
 * A template registers itself by calling Booster.register({...}). See
 * templates/README.md for the contract.
 */
window.Booster = (function () {
  "use strict";

  /* Used only if tiers.json cannot be fetched (for example when a page is
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

  /* Tier badges. A tier names one of these in its "mark" field. The shapes
     escalate deliberately — an outlined ring, a solid star, then a faceted
     gem — so the climb reads even in a re-compressed WhatsApp image. */
  var MARKS = {
    diamond: '<svg width="W" height="W" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="M12 2.5 20.5 9 12 21.5 3.5 9z" fill="C"></path><path d="M3.5 9h17M12 2.5 8.5 9l3.5 12.5M12 2.5 15.5 9 12 21.5" fill="none" stroke="#0E1419" stroke-width="1.1" stroke-linejoin="round"></path></svg>',
    star: '<svg width="W" height="W" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><path d="m12 2.8 2.7 5.9 6.4.8-4.7 4.4 1.2 6.3L12 17.1l-5.6 3.1 1.2-6.3L2.9 9.5l6.4-.8z" fill="C"></path></svg>',
    ring: '<svg width="W" height="W" viewBox="0 0 24 24" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="8.6" fill="none" stroke="C" stroke-width="2.2"></circle><circle cx="12" cy="12" r="3.4" fill="C"></circle></svg>'
  };

  var config = FALLBACK;
  var baseTiers = FALLBACK.tiers;   // the defaults, as committed in tiers.json
  var activeTiers = null;           // what the board being rendered right now uses
  var order = [];
  var byId = {};
  var couplets = [];                // couplet ids, in the order they first appear

  /* ---------- registry ---------- */

  function register(t) {
    if (!t || !t.id) throw new Error("A template needs an id");
    if (byId[t.id]) return;
    if (t.css) {
      var style = document.createElement("style");
      style.setAttribute("data-template", t.id);
      style.textContent = t.css;
      document.head.appendChild(style);
    }
    byId[t.id] = t;
    order.push(t.id);
    if (t.couplet && couplets.indexOf(t.couplet) === -1) couplets.push(t.couplet);
  }

  /* The templates grouped into couplets: a leaderboard and its matching reward
     poster, which share a look and are meant to go out together. */
  function coupletList() {
    var groups = couplets.map(function (id) {
      var members = list().filter(function (t) { return t.couplet === id; });
      return { id: id, name: (members[0] && members[0].coupletName) || id, templates: members };
    });
    var loose = list().filter(function (t) { return !t.couplet; });
    if (loose.length) groups.push({ id: "other", name: "Other", templates: loose });
    return groups;
  }

  /* The other half of a template's couplet, for the link between the two. */
  function partnerOf(t) {
    if (!t || !t.couplet) return null;
    var others = list().filter(function (o) { return o.couplet === t.couplet && o.id !== t.id; });
    return others[0] || null;
  }

  function list() {
    return order.map(function (id) { return byId[id]; });
  }

  /* A template answers to its id or to its code, so a person can type either
     and a short link can carry whichever they were given. */
  function get(key) {
    if (!key) return null;
    if (byId[key]) return byId[key];
    var want = String(key).toUpperCase();
    var hit = list().filter(function (t) { return (t.code || "").toUpperCase() === want; });
    return hit[0] || null;
  }

  function getConfig() {
    return {
      currency: config.currency,
      maxRowsOnBoard: config.maxRowsOnBoard,
      brand: config.brand,
      tiers: tiersInPlay()
    };
  }

  function loadConfig() {
    return fetch("tiers.json", { cache: "no-cache" })
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
          baseTiers = json.tiers;
        }
      })
      .catch(function () { /* keep the built-in tiers */ });
  }

  /* ---------- tiers ----------
     tiers.json holds the defaults. Each board edits its own copy of the
     thresholds and amounts, the same as any other field on its form, so a
     one-off board never changes what the next one shows. */

  function tiersInPlay() { return activeTiers || baseTiers; }

  /* Set by whoever is about to render, and cleared after. */
  function useTiers(tiers) { activeTiers = tiers && tiers.length ? tiers : null; }

  /* The committed defaults, as plain {min, amount} per tier, to seed a form. */
  function defaultTierValues() {
    var out = {};
    baseTiers.forEach(function (t) { out[t.key] = { min: t.min, amount: t.amount }; });
    return out;
  }

  /* Fold a form's numbers back onto the committed tiers, so colours, names and
     badges keep coming from tiers.json while the numbers come from the board. */
  function tiersFrom(values) {
    return baseTiers.map(function (t) {
      var v = values && values[t.key];
      if (!v) return t;
      var copy = {};
      for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) copy[k] = t[k];
      if (typeof v.min === "number") copy.min = v.min;
      if (typeof v.amount === "number") copy.amount = v.amount;
      return copy;
    });
  }

  /* ---------- text ---------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

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

  /* ---------- tiers ---------- */

  function sortedTiers() {
    return tiersInPlay().slice().sort(function (a, b) { return b.min - a.min; });
  }

  function tierByKey(k) {
    var all = tiersInPlay();
    for (var i = 0; i < all.length; i++) {
      if (all[i].key === k) return all[i];
    }
    return null;
  }

  function tierFor(meters) {
    var list_ = sortedTiers();
    for (var i = 0; i < list_.length; i++) {
      if (meters >= list_[i].min) return list_[i];
    }
    return null;
  }

  function effectiveTier(row) {
    if (!row) return null;
    return row.tier ? tierByKey(row.tier) : (row.m > 0 ? tierFor(row.m) : null);
  }

  function mark(tier, size) {
    var shape = MARKS[tier && tier.mark] || MARKS.ring;
    return shape.replace(/W/g, String(size)).replace(/C/g, (tier && tier.color) || "#C3CBD6");
  }

  /* ---------- preview ---------- */

  /* Scale a fixed-size board down into its container, and give the container
     the matching height so the page does not keep a tall empty gap. */
  function fit(stage, board, w, h) {
    if (!stage || !board) return;
    var available = stage.clientWidth;
    if (!available) return;
    var k = available / w;
    board.style.transformOrigin = "top left";
    board.style.transform = "scale(" + k + ")";
    stage.style.height = Math.round(h * k) + "px";
  }

  /* ---------- export ---------- */

  /* Paint a board element to a PNG at its true pixel size and hand it to the
     browser as a download. The board is cloned off-screen so the on-page
     preview keeps its scale transform, which html2canvas would otherwise bake
     into the image. */
  function exportPNG(board, w, h, filename, background) {
    if (typeof html2canvas !== "function") {
      return Promise.reject(new Error("renderer unavailable"));
    }
    return Promise.resolve(document.fonts && document.fonts.ready).then(function () {
      var holder = document.createElement("div");
      holder.style.cssText = "position:fixed;left:-20000px;top:0;width:" + w + "px;height:" + h + "px;";
      var copy = board.cloneNode(true);
      copy.style.transform = "none";
      holder.appendChild(copy);
      document.body.appendChild(holder);

      return html2canvas(holder.firstChild, {
        width: w,
        height: h,
        scale: 1,
        backgroundColor: background || "#0E1419",
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
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
      return true;
    });
  }

  return {
    register: register,
    list: list,
    get: get,
    getConfig: getConfig,
    loadConfig: loadConfig,
    couplets: coupletList,
    partnerOf: partnerOf,
    useTiers: useTiers,
    defaultTierValues: defaultTierValues,
    tiersFrom: tiersFrom,
    esc: esc,
    todayISO: todayISO,
    formatDate: formatDate,
    sortedTiers: sortedTiers,
    tierByKey: tierByKey,
    tierFor: tierFor,
    effectiveTier: effectiveTier,
    mark: mark,
    fit: fit,
    exportPNG: exportPNG
  };
})();
