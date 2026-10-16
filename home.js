/* Home screen
 *
 * The creatives come in couplets: a leaderboard and the reward poster that
 * matches it. They are meant to go out together and share a look, so the
 * gallery groups them rather than listing six loose cards.
 */
(function () {
  "use strict";

  var host = document.getElementById("couplets");
  if (!host) return;

  /* Every card previews the real board at the committed defaults. */
  function previewState(t) {
    var values = {};
    (t.fields || []).forEach(function (f) {
      values[f.key] = f.default === "today" && f.type === "date" ? Booster.todayISO() : (f.default || "");
    });

    var rows = [];
    if (t.rows) {
      rows = (t.rows.examples || []).map(function (e) {
        var r = {};
        t.rows.columns.forEach(function (c) {
          r[c.key] = c.type === "number" ? 0 : c.type === "tier" ? null : "";
        });
        Object.keys(e).forEach(function (k) { r[k] = e[k]; });
        return r;
      });
    }
    return { values: values, rows: rows, examples: true };
  }

  function roleLabel(t) {
    return t.role === "leaderboard" ? "Leaderboard" : t.role === "rewards" ? "Reward info" : "";
  }

  function card(t) {
    var role = roleLabel(t);
    return '<a class="tcard" href="studio.html?t=' + encodeURIComponent(t.id) + '">' +
      '<div class="tcard-stage" data-id="' + Booster.esc(t.id) + '">' +
      '<div class="tcard-board"></div></div>' +
      '<div class="tcard-body">' +
      '<div class="tcard-meta">' +
      '<span class="code">' + Booster.esc(t.code || "\u2014") + "</span>" +
      (role ? '<span class="tcard-role">' + Booster.esc(role) + "</span>" : "") +
      "</div>" +
      "<h3>" + Booster.esc(t.name) + "</h3>" +
      "<p>" + Booster.esc(t.description) + "</p>" +
      '<span class="tcard-go">Open template &rarr;</span>' +
      "</div></a>";
  }

  function draw() {
    var groups = Booster.couplets();

    host.innerHTML = groups.map(function (g) {
      return '<section class="couplet">' +
        '<h2 class="sectionhead">' + Booster.esc(g.name) +
        '<span class="couplet-count">' + g.templates.length + " creatives</span></h2>" +
        '<div class="gallery">' + g.templates.map(card).join("") + "</div>" +
        "</section>";
    }).join("");

    /* Each preview renders against the defaults, never another board's edits. */
    Booster.list().forEach(function (t) {
      var stage = host.querySelector('.tcard-stage[data-id="' + t.id + '"]');
      if (!stage) return;
      Booster.useTiers(null);
      var board = stage.querySelector(".tcard-board");
      board.style.width = t.size.w + "px";
      board.style.height = t.size.h + "px";
      board.innerHTML = t.render(previewState(t), Booster.getConfig());
      stage.style.background = t.background || "#0E1419";
      fitCard(stage, board, t);
    });

    drawDefaults();
  }

  /* A read-only reminder of where every board starts. The numbers are edited
     per board, inside the studio, so there is nothing to change here. */
  function drawDefaults() {
    var panel = document.getElementById("tierdefaults");
    if (!panel) return;
    var config = Booster.getConfig();
    panel.innerHTML = Booster.sortedTiers().map(function (t) {
      return '<div class="tierdef">' +
        "<div>" + Booster.mark(t, 26) + "</div>" +
        '<div class="td-name">' + Booster.esc(t.name) + "</div>" +
        '<div class="td-min">' + t.min + "+ m</div>" +
        '<div class="td-amt">' + config.currency + t.amount + " each</div></div>";
    }).join("");
  }

  /* The card shows the top of the board, cropped, rather than the whole
     1080x1350 shrunk to thumbnail size where no text would be readable. */
  function fitCard(stage, board, t) {
    var w = stage.clientWidth;
    if (!w) return;
    board.style.transformOrigin = "top left";
    board.style.transform = "scale(" + (w / t.size.w) + ")";
  }

  function refit() {
    Booster.list().forEach(function (t) {
      var stage = host.querySelector('.tcard-stage[data-id="' + t.id + '"]');
      if (stage) fitCard(stage, stage.querySelector(".tcard-board"), t);
    });
  }

  window.addEventListener("resize", refit);
  Booster.loadConfig().then(draw);
})();
