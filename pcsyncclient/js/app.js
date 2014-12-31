'use strict';

/* global ServerManager, HandlersManager */

// Global variables for video_metadata_scripts.js
// Initialized in video_handler.js
var videoDB = null;
var addVideo = null;

// Global variable for gallery_metadata_scripts.js
// Initialized in video_handler.js
var videostorage = null;

(function(exports) {

var App = function() {
  this.started = false;
};

App.prototype.start = function() {
  if (this.started) {
    console.log('App is running.');
    return;
  }

  this.started = true;

  this.wifiHelper = new WifiHelper(this);
  this.wifiHelper.getWifiCode();

  this.uiManager = new UIManager(this);
  this.uiManager.init();

  this.serverManager = new ServerManager(this);
  this.serverManager.start();

  this.handlersManager = new HandlersManager(this);
  this.handlersManager.start();
};

App.prototype.stop = function() {
  if (!this.started) {
    console.log('App has been stopped.');
    return;
  }

  this.started = false;

  this.wifiHelper = null;

  if (this.uiManager) {
    this.uiManager.showConnectedPage(false);
    this.uiManager = null;
  }

  if (this.serverManager) {
    this.serverManager.stop();
    this.serverManager = null;
  }

  if (this.handlersManager) {
    this.handlersManager.stop();
    this.handlersManager = null;
  }
};

exports.App = App;

})(window);
