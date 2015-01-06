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

})(window);
