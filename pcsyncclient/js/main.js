'use strict';

/* global App */

(function() {

var Main = {
  init: function() {
    var app = new App();
    app.start();
  }
};

window.addEventListener('load', function onload(evt) {
  window.removeEventListener('load', onload);
  Main.init();
}, true);

window.addEventListener('localized', function localized() {
  // This will be called during startup, and any time the languange is changed
  // Set the 'lang' and 'dir' attributes to <html> when the page is translated
  document.documentElement.lang = navigator.mozL10n.language.code;
  document.documentElement.dir = navigator.mozL10n.language.direction;

  // Look for any iframes and localize them - mozL10n doesn't do this
  Array.prototype.forEach.call(document.querySelectorAll('iframe'), function forEachIframe(iframe) {
    var doc = iframe.contentDocument;
    doc.documentElement.lang = navigator.mozL10n.language.code;
    doc.documentElement.dir = navigator.mozL10n.language.direction;
    navigator.mozL10n.translate(doc.body);
  });

  // Also look for not-downloaded-message and re-translate the date message.
  // More complex because the argument to the l10n string is itself a formatted
  // date using l10n.
  Array.prototype.forEach.call(
  document.getElementsByClassName('not-downloaded-message'), function(element) {
    if (!(element.dataset.l10nArgs && element.dataset.l10nId && element.dataset.l10nDate)) {
      return;
    }
    var args = JSON.parse(element.dataset.l10nArgs);
    var format = navigator.mozL10n.get(element.dataset.l10nDateFormat);
    var date = new Date(element.dataset.l10nDate);
    args.date = Utils.date.format.localeFormat(date, format);

    navigator.mozL10n.localize(element, element.dataset.l10nId, args);
  });
});

})(window);
