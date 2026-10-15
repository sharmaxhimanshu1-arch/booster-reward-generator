/* The tier panel, shared by the home screen and the studio.
 *
 * Thresholds and amounts are editable here. An edit is kept in this manager's
 * browser and reaches nobody else, so the panel says so plainly and offers the
 * file to commit, which is what makes a change stick for everyone.
 */
(function () {
  "use strict";

  var host = document.getElementById("tiers");
  if (!host) return;

  function draw() {
    var config = Booster.getConfig();
    var changed = Booster.hasOverrides();

    var rows = Booster.sortedTiers().map(function (t) {
      return '<div class="tierref" data-key="' + Booster.esc(t.key) + '">' +
        '<div class="tr-mark">' + Booster.mark(t, 26) + "</div>" +
        '<div class="tr-name">' + Booster.esc(t.name) + "</div>" +
        '<div class="tr-field">' +
        '<label for="tmin_' + Booster.esc(t.key) + '">Meters</label>' +
        '<div class="tr-input"><input id="tmin_' + Booster.esc(t.key) + '" data-field="min" type="number" min="0" step="1" inputmode="numeric" value="' + t.min + '"><span>+</span></div>' +
        "</div>" +
        '<div class="tr-field">' +
        '<label for="tamt_' + Booster.esc(t.key) + '">Each</label>' +
        '<div class="tr-input"><span>' + config.currency + '</span><input id="tamt_' + Booster.esc(t.key) + '" data-field="amount" type="number" min="0" step="1" inputmode="numeric" value="' + t.amount + '"></div>' +
        "</div></div>";
    }).join("");

    var footer = changed
      ? '<div class="tr-changed">' +
        "<p><strong>Changed on this device.</strong> These amounts are saved in this browser only — other managers still see the committed ones, so boards made elsewhere will not match.</p>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn btn-primary" id="tr-download">Download tiers.json</button>' +
        '<button type="button" class="btn" id="tr-reset">Undo my changes</button>' +
        "</div>" +
        '<p class="note">Commit that file to the repository to make these the amounts everyone sees.</p>' +
        "</div>"
      : "";

    host.innerHTML = rows + footer;
  }

  host.addEventListener("change", function (e) {
    var field = e.target.getAttribute("data-field");
    if (!field) return;
    var key = e.target.closest(".tierref").getAttribute("data-key");
    Booster.setTierValue(key, field, e.target.value);
  });

  host.addEventListener("click", function (e) {
    if (e.target.id === "tr-reset") {
      Booster.resetTiers();
      return;
    }
    if (e.target.id === "tr-download") {
      var blob = new Blob([Booster.tiersFile()], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "tiers.json";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(url); a.remove(); }, 2000);
    }
  });

  Booster.onTiersChanged(draw);
  Booster.loadConfig().then(draw);
})();
