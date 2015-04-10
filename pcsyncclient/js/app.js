'use strict';

/* global UIManager, ServerManager, HandlersManager */

// Global variables for video_metadata_scripts.js
// Initialized in video_handler.js
var videoDB = null;
var addVideo = null;

// Global variable for gallery_metadata_scripts.js
// Initialized in video_handler.js
var videostorage = null;

(function(exports) {

var App = function() {
  this.serverManager = new ServerManager(this);
  this.handlersManager = new HandlersManager(this);
  this.uiManager = new UIManager(this);
};

App.prototype.start = function() {
  this.uiManager.loading(true);
  this.uiManager.init();
  this.serverManager.init();
  this.getWifiCode();
};

App.prototype.reset = function() {
  this.uiManager.loading(true);
  this.serverManager.restart();
  this.getWifiCode();
};

App.prototype.getWifiCode = function() {
  try {
    this.ipAddress = '0.0.0.0';
    this.firstConn = true;
    this.wifiEnabled = true;
    var PeerConnection =
      window.RTCPeerConnection || window.mozRTCPeerConnection;
    var pc = new PeerConnection();

    pc.onicecandidate = function(evt) {
      if (evt.candidate && this.firstConn) {
        this.firstConn = false;
        var strArray = evt.candidate.candidate.split(' ');
        switch(strArray.length) {
          case 8:
            this.ipAddress = strArray[4];
            break;
          case 12:
            this.ipAddress = strArray[9];
            break;
        }
      }
      this.uiManager.updateWifiCode(this.ipAddress);
      this.uiManager.loading(false);
    }.bind(this);

    pc.oniceconnectionstatechange = function(e) {
      this.wifiEnabled = false;
    }.bind(this);

    pc.createDataChannel('DataChannel');
    pc.createOffer(function(desc) {
      if (desc && desc.sdp && this.wifiEnabled) {
        var startPos = desc.sdp.indexOf('c=', 0);
        var endPos = desc.sdp.indexOf('\r\n', startPos);
        var ipString = desc.sdp.substring(startPos + 2, endPos);
        var array = ipString.split(' ');
        if (array[2] == '0.0.0.0') {
          pc.setLocalDescription(desc);
        } else {
          this.ipAddress = array[2];
          this.uiManager.updateWifiCode(this.ipAddress);
          this.uiManager.loading(false);
        }
      } else {
        this.uiManager.updateWifiCode(this.ipAddress);
        this.uiManager.loading(false);
      }
    }.bind(this), function(error) {
      this.uiManager.updateWifiCode(this.ipAddress);
      this.uiManager.loading(false);
    }.bind(this));
  } catch (e) {
    this.wifiEnabled = false;
    this.uiManager.updateWifiCode(this.ipAddress);
    this.uiManager.loading(false);
  }
};

exports.App = App;

})(window);
