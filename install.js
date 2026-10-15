/* Offers the install prompt on browsers that support it, and tells iPhone
 * users where their own Add to Home Screen lives, since Safari never fires an
 * install event. The bar stays hidden when the studio is already installed.
 */
(function () {
  "use strict";

  var bar = document.getElementById("installbar");
  var btn = document.getElementById("installbtn");
  if (!bar || !btn) return;

  var standalone = window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
  if (standalone) return;

  var deferred = null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferred = e;
    bar.hidden = false;
  });

  btn.addEventListener("click", function () {
    if (!deferred) return;
    deferred.prompt();
    deferred.userChoice.then(function () {
      deferred = null;
      bar.hidden = true;
    });
  });

  window.addEventListener("appinstalled", function () { bar.hidden = true; });

  /* iOS: no install event, so show the one step that works there. */
  var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (iOS) {
    btn.hidden = true;
    bar.querySelector("span").textContent =
      "In Safari, tap Share, then Add to Home Screen.";
    bar.hidden = false;
  }
})();
