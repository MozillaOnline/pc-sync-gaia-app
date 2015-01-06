'use strict';

(function(exports) {

var WifiHelper = function(app) {
  this.app = app;
  this.ipAddress = '0.0.0.0';
  this.firstConn = true;
  this.wifiEnabled = true;
};

WifiHelper.prototype.getWifiCode = function() {
  try {
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
      this.app.uiManager.updateWifiCode(this.ipAddress);
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
          this.app.uiManager.updateWifiCode(this.ipAddress);
        }
      } else {
        this.app.uiManager.updateWifiCode(this.ipAddress);
      }
    }.bind(this), function(error) {
      this.app.uiManager.updateWifiCode(this.ipAddress);
    }.bind(this));
  } catch (e) {
    this.wifiEnabled = false;
    this.app.uiManager.updateWifiCode(this.ipAddress);
  }
};

exports.WifiHelper = WifiHelper;

})(window);
