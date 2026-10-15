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

  var OVERRIDE_KEY = "booster-tiers-override-v1";

  var config = FALLBACK;
  var baseTiers = FALLBACK.tiers;   // as committed in tiers.json
  var overrides = {};               // { tierKey: {min, amount} } for THIS browser only
  var listeners = [];
  var order = [];
  var byId = {};

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
  }

  function list() {
    return order.map(function (id) { return byId[id]; });
  }

  function get(id) {
    return byId[id] || null;
  }

  function getConfig() { return config; }

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
      .catch(function () { /* keep the built-in tiers */ })
      .then(function () {
        readOverrides();
        applyOverrides();
      });
  }

  /* ---------- amounts changed on this device ----------
     tiers.json is what everyone shares. A manager can still change a threshold
     or an amount here, which is kept in this browser only and never reaches
     anyone else — so the UI has to say so, and offer the file to commit. */

  function readOverrides() {
    try {
      var raw = localStorage.getItem(OVERRIDE_KEY);
      overrides = raw ? (JSON.parse(raw) || {}) : {};
    } catch (e) { overrides = {}; }
  }

  function writeOverrides() {
    try {
      if (hasOverrides()) localStorage.setItem(OVERRIDE_KEY, JSON.stringify(overrides));
      else localStorage.removeItem(OVERRIDE_KEY);
    } catch (e) { /* blocked storage: the edit lives for this page load only */ }
  }

  function applyOverrides() {
    config.tiers = baseTiers.map(function (t) {
      var o = overrides[t.key];
      if (!o) return t;
      var copy = {};
      for (var k in t) if (Object.prototype.hasOwnProperty.call(t, k)) copy[k] = t[k];
      if (typeof o.min === "number") copy.min = o.min;
      if (typeof o.amount === "number") copy.amount = o.amount;
      return copy;
    });
    listeners.forEach(function (fn) { try { fn(); } catch (e) { /* one listener must not stop the rest */ } });
  }

  function hasOverrides() {
    for (var k in overrides) {
      if (Object.prototype.hasOwnProperty.call(overrides, k)) return true;
    }
    return false;
  }

  /* field is "min" or "amount"; a value equal to the committed one clears the
     override rather than storing a redundant copy. */
  function setTierValue(key, field, value) {
    var base = null;
    for (var i = 0; i < baseTiers.length; i++) if (baseTiers[i].key === key) base = baseTiers[i];
    if (!base) return;

    var n = Math.max(0, Math.round(Number(value) || 0));
    if (n === base[field]) {
      if (overrides[key]) {
        delete overrides[key][field];
        var empty = true;
        for (var f in overrides[key]) if (Object.prototype.hasOwnProperty.call(overrides[key], f)) empty = false;
        if (empty) delete overrides[key];
      }
    } else {
      if (!overrides[key]) overrides[key] = {};
      overrides[key][field] = n;
    }
    writeOverrides();
    applyOverrides();
  }

  function resetTiers() {
    overrides = {};
    writeOverrides();
    applyOverrides();
  }

  /* The committed file with this device's values folded in, ready to replace
     tiers.json in the repository. */
  function tiersFile() {
    var out = {
      currency: config.currency,
      maxRowsOnBoard: config.maxRowsOnBoard,
      brand: config.brand,
      tiers: config.tiers
    };
    return JSON.stringify(out, null, 2) + "\n";
  }

  function onTiersChanged(fn) { if (typeof fn === "function") listeners.push(fn); }

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
    return config.tiers.slice().sort(function (a, b) { return b.min - a.min; });
  }

  function tierByKey(k) {
    for (var i = 0; i < config.tiers.length; i++) {
      if (config.tiers[i].key === k) return config.tiers[i];
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
    setTierValue: setTierValue,
    resetTiers: resetTiers,
    hasOverrides: hasOverrides,
    tiersFile: tiersFile,
    onTiersChanged: onTiersChanged,
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
