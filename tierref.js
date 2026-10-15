/* Renders the read-only tier reference panel, shared by the studio pages. */
(function () {
  "use strict";
  var host = document.getElementById("tiers");
  if (!host) return;

  function draw() {
    var config = Booster.getConfig();
    host.innerHTML = Booster.sortedTiers().map(function (t) {
      return '<div class="tierref">' +
        "<div>" + Booster.mark(t, 26) + "</div>" +
        '<div class="tname">' + Booster.esc(t.name) + "</div>" +
        '<div class="tmin">' + t.min + "+ m</div>" +
        '<div class="tamt">' + config.currency + t.amount + " each</div>" +
        "</div>";
    }).join("");
  }

  Booster.loadConfig().then(draw);
})();
