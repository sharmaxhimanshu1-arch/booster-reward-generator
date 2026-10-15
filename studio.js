/* Studio
 * The editor shell. It reads ?t=<template id>, builds the form from that
 * template's field and row definitions, and renders its board into the
 * preview. Nothing here knows what any particular creative looks like.
 */
(function () {
  "use strict";

  function $(id) { return document.getElementById(id); }
  function esc(s) { return Booster.esc(s); }

  var template = null;
  var state = { values: {}, rows: [], examples: false };
  var draftKey = "";

  /* ---------- draft, kept in this browser only ---------- */

  function saveDraft() {
    try { localStorage.setItem(draftKey, JSON.stringify(state)); } catch (e) { /* blocked storage */ }
  }

  function loadDraft() {
    try {
      var raw = localStorage.getItem(draftKey);
      if (!raw) return false;
      var d = JSON.parse(raw);
      if (!d || typeof d.values !== "object") return false;
      state.values = d.values || {};
      state.rows = Array.isArray(d.rows) ? d.rows : [];
      state.examples = !!d.examples;
      return true;
    } catch (e) { return false; }
  }

  function defaults() {
    var v = {};
    (template.fields || []).forEach(function (f) {
      v[f.key] = f.default === "today" && f.type === "date" ? Booster.todayISO() : (f.default || "");
    });
    return v;
  }

  /* ---------- fields ---------- */

  function renderFields() {
    var host = $("fields");
    var fields = template.fields || [];
    if (!fields.length) { host.closest(".card").hidden = true; return; }

    host.innerHTML = fields.map(function (f, i) {
      var id = "f_" + f.key;
      var val = state.values[f.key] == null ? "" : state.values[f.key];
      var control;
      if (f.type === "textarea") {
        control = '<textarea id="' + id + '" data-key="' + esc(f.key) + '" rows="2">' + esc(val) + "</textarea>";
      } else {
        var type = f.type === "date" ? "date" : f.type === "number" ? "number" : "text";
        control = '<input id="' + id + '" data-key="' + esc(f.key) + '" type="' + type + '" value="' + esc(val) + '">';
      }
      return '<div class="field' + (f.type === "date" ? " field-narrow" : "") + '">' +
        '<label for="' + id + '">' + esc(f.label) + "</label>" + control +
        (f.hint ? '<p class="hint">' + esc(f.hint) + "</p>" : "") +
        "</div>";
    }).join("");
  }

  /* ---------- rows ---------- */

  function rowTemplate() {
    var r = {};
    template.rows.columns.forEach(function (c) {
      r[c.key] = c.type === "number" ? 0 : c.type === "tier" ? null : "";
    });
    return r;
  }

  function renderRows() {
    if (!template.rows) return;
    var cols = template.rows.columns;
    var config = Booster.getConfig();
    var tiers = Booster.sortedTiers();

    $("rows").innerHTML = state.rows.map(function (r, i) {
      var cells = cols.map(function (c) {
        var id = c.key + i;
        var label = '<label class="sr-only" for="' + id + '">' + esc(c.label) + "</label>";

        if (c.type === "tier") {
          var auto = r.m > 0 ? Booster.tierFor(r.m) : null;
          var opts = '<option value="">' +
            esc(auto ? "Auto — " + auto.name + " " + config.currency + auto.amount : "Auto — below target") +
            "</option>";
          opts += tiers.map(function (t) {
            return '<option value="' + esc(t.key) + '"' + (r[c.key] === t.key ? " selected" : "") + ">" +
              esc(t.name) + " " + config.currency + t.amount + "</option>";
          }).join("");
          return '<div class="cell-' + esc(c.key) + '">' + label +
            '<select id="' + id + '" data-key="' + esc(c.key) + '">' + opts + "</select></div>";
        }

        var attrs = c.type === "number"
          ? 'type="number" min="0" step="1" inputmode="numeric"'
          : 'type="text" autocomplete="off"';
        return '<div class="cell-' + esc(c.key) + '">' + label +
          '<input id="' + id + '" data-key="' + esc(c.key) + '" ' + attrs +
          ' value="' + esc(r[c.key] || (c.type === "number" ? "" : "")) + '"' +
          ' placeholder="' + esc(c.placeholder || "") + '"></div>';
      }).join("");

      return '<div class="row" data-i="' + i + '">' + cells +
        '<button type="button" class="icon-btn" data-remove="' + i + '" aria-label="Remove row ' + (i + 1) + '">&times;</button>' +
        "</div>";
    }).join("");

    if (typeof template.status === "function") {
      $("rownote").textContent = template.status(state, config);
    }
  }

  function setRowGrid() {
    if (!template.rows) return;
    var tracks = template.rows.columns.map(function (c) {
      return c.grow ? "minmax(0, 1fr)" : (c.width || "auto");
    }).join(" ") + " 44px";
    var style = document.createElement("style");
    style.textContent = ".grid-head, .row { grid-template-columns: " + tracks + "; }";
    document.head.appendChild(style);

    $("gridhead").innerHTML = template.rows.columns.map(function (c) {
      return "<span>" + esc(c.label) + "</span>";
    }).join("") + "<span></span>";
  }

  /* ---------- board ---------- */

  function renderBoard() {
    var config = Booster.getConfig();
    $("board").innerHTML = template.render(state, config);
    var board = $("board").firstChild;
    $("board").style.width = template.size.w + "px";
    $("board").style.height = template.size.h + "px";
    Booster.fit($("stage"), $("board"), template.size.w, template.size.h);
    return board;
  }

  function refresh() {
    renderRows();
    renderBoard();
    saveDraft();
  }

  /* ---------- wiring ---------- */

  function wire() {
    $("fields").addEventListener("input", function (e) {
      var key = e.target.getAttribute("data-key");
      if (!key) return;
      state.values[key] = e.target.value;
      renderBoard();
      saveDraft();
    });

    if (!template.rows) return;

    $("rows").addEventListener("input", function (e) {
      var key = e.target.getAttribute("data-key");
      if (!key) return;
      var i = parseInt(e.target.closest(".row").getAttribute("data-i"), 10);
      var col = template.rows.columns.filter(function (c) { return c.key === key; })[0];
      state.rows[i][key] = col && col.type === "number" ? (parseInt(e.target.value, 10) || 0) : e.target.value;
      if (col && col.type === "number") renderRows();
      renderBoard();
      saveDraft();
    });

    $("rows").addEventListener("change", function (e) {
      var key = e.target.getAttribute("data-key");
      if (!key || e.target.tagName !== "SELECT") return;
      var i = parseInt(e.target.closest(".row").getAttribute("data-i"), 10);
      state.rows[i][key] = e.target.value || null;
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
      state.rows.push(rowTemplate());
      refresh();
      var inputs = $("rows").querySelectorAll("input");
      if (inputs.length) inputs[inputs.length - template.rows.columns.length].focus();
    });

    $("sortrows").addEventListener("click", function () {
      state.rows.sort(function (a, b) { return (b.m || 0) - (a.m || 0); });
      refresh();
    });

    $("clearexamples").addEventListener("click", function () {
      state.rows = [rowTemplate()];
      state.examples = false;
      hideBanner();
      refresh();
    });
  }

  function hideBanner() { $("examplebanner").hidden = true; }

  $("download").addEventListener("click", function () {
    var status = $("status");
    var btn = this;

    if (template.rows && typeof template.eligible === "function" &&
        !template.eligible(state, Booster.getConfig()).length) {
      status.textContent = "Add at least one crew before downloading.";
      return;
    }

    status.textContent = "Rendering…";
    btn.disabled = true;

    var board = $("board").firstChild;
    Booster.exportPNG(board, template.size.w, template.size.h,
      template.filename(state), template.background)
      .then(function () {
        status.textContent = "Saved to your downloads. Send it to the crew group.";
      })
      .catch(function () {
        status.textContent = "Could not build the image. Reload the page and try again.";
      })
      .then(function () { btn.disabled = false; });
  });

  window.addEventListener("resize", function () {
    if (!template) return;
    Booster.fit($("stage"), $("board"), template.size.w, template.size.h);
  });

  /* ---------- start ---------- */

  function start() {
    var id = new URLSearchParams(location.search).get("t");
    template = Booster.get(id);

    if (!template) {
      $("studio").hidden = true;
      $("missing").hidden = false;
      return;
    }

    draftKey = "booster-draft-v2-" + template.id;
    document.title = template.name + " — Daily Booster Studio";
    $("tname").textContent = template.name;
    $("tdesc").textContent = template.description;

    if (!loadDraft()) {
      state.values = defaults();
      if (template.rows) {
        state.rows = (template.rows.examples || []).map(function (e) {
          var r = rowTemplate();
          Object.keys(e).forEach(function (k) { r[k] = e[k]; });
          return r;
        });
        state.examples = state.rows.length > 0;
      }
    }

    if (template.rows) {
      $("rowcard").hidden = false;
      $("rowcard").querySelector("h2").textContent = template.rows.label;
      $("addrow").textContent = template.rows.addLabel;
      setRowGrid();
    }
    if (!state.examples) hideBanner();

    renderFields();
    wire();
    refresh();
  }

  Booster.onTiersChanged(function () {
    if (!template) return;
    renderRows();
    renderBoard();
  });

  Booster.loadConfig().then(start);
})();
