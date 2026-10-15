/* Home screen
 * Lists every registered template as a card with a live preview of the real
 * board, so a manager recognises the creative before opening it.
 */
(function () {
  "use strict";

  var gallery = document.getElementById("gallery");
  if (!gallery) return;

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

  function draw() {
    var config = Booster.getConfig();

    gallery.innerHTML = Booster.list().map(function (t) {
      return '<a class="tcard" href="studio.html?t=' + encodeURIComponent(t.id) + '">' +
        '<div class="tcard-stage" data-id="' + Booster.esc(t.id) + '">' +
        '<div class="tcard-board"></div></div>' +
        '<div class="tcard-body">' +
        "<h3>" + Booster.esc(t.name) + "</h3>" +
        "<p>" + Booster.esc(t.description) + "</p>" +
        '<span class="tcard-go">Open template &rarr;</span>' +
        "</div></a>";
    }).join("");

    Booster.list().forEach(function (t) {
      var stage = gallery.querySelector('.tcard-stage[data-id="' + t.id + '"]');
      if (!stage) return;
      var board = stage.querySelector(".tcard-board");
      board.style.width = t.size.w + "px";
      board.style.height = t.size.h + "px";
      board.innerHTML = t.render(previewState(t), config);
      stage.style.background = t.background || "#0E1419";
      fitCard(stage, board, t);
    });
  }

  /* The card shows the top of the board, cropped, rather than the whole
     1080x1350 shrunk to thumbnail size where no text would be readable. */
  function fitCard(stage, board, t) {
    var w = stage.clientWidth;
    if (!w) return;
    var k = w / t.size.w;
    board.style.transformOrigin = "top left";
    board.style.transform = "scale(" + k + ")";
  }

  function refit() {
    Booster.list().forEach(function (t) {
      var stage = gallery.querySelector('.tcard-stage[data-id="' + t.id + '"]');
      if (stage) fitCard(stage, stage.querySelector(".tcard-board"), t);
    });
  }

  window.addEventListener("resize", refit);
  Booster.loadConfig().then(draw);
})();
