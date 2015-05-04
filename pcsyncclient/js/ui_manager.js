'use strict';

(function(exports) {

var UIManager = function(app) {
  this.app = app;
  this.connectedPage = document.getElementById('connected-region');
  this.unconnectedPage = document.getElementById('unconnect-region');
};

UIManager.prototype.init = function() {
  document.addEventListener(CMD_TYPE.app_connected,
                            this.accceptDialog.bind(this));

  var backButton = document.getElementById("help-general-back");
  backButton.onmousedown = backButton.ontouchstart = function() {
    this.classList.add('touchover');
  };
  backButton.onmouseup = backButton.ontouchend = function() {
    this.classList.remove('touchover');
    document.getElementById('modal-help-general').classList.add('hidden');
  };

  var usbBackButton = document.getElementById("help-usb-back");
  usbBackButton.onmousedown = usbBackButton.ontouchstart = function() {
    this.classList.add('touchover');
  };
  usbBackButton.onmouseup = usbBackButton.ontouchend = function() {
    this.classList.remove('touchover');
    document.getElementById('modal-help-usb').classList.add('hidden');
  };

  var disconnectButton = document.getElementById('button-disconnect');
  disconnectButton.onclick = function(event) {
    this.app.reset();
  }.bind(this);

  var reconnectButton = document.getElementById('button-restart-service');
  reconnectButton.onclick = function() {
    this.app.reset();
  }.bind(this);

  document.getElementById('unconnect-view-help').onclick = function () {
    document.getElementById('modal-help-general').classList.remove('hidden');
  };
  document.getElementById('unconnect-view-usb').onclick = function () {
    document.getElementById('modal-help-usb').classList.remove('hidden');
  };

  document.getElementById('accept-button').onclick = function () {
    document.getElementById('custom-confirm').classList.add('hidden');
    var dataJson = {
      id: CMD_ID.app_accepted,
      flag: CMD_TYPE.app_accepted,
      datalength: 0
    };
    this.app.serverManager.mainSocketWrapper.send(dataJson, null);
    this.app.uiManager.showConnectedPage(true);
  }.bind(this);
  document.getElementById('reject-button').onclick = function () {
    document.getElementById('custom-confirm').classList.add('hidden');
    var dataJson = {
      id: CMD_ID.app_rejected,
      flag: CMD_TYPE.app_rejected,
      datalength: 0
    };
    this.app.serverManager.mainSocketWrapper.send(dataJson, null);
    this.app.serverManager.restart();
  }.bind(this);

  this.showConnectedPage(false);
};

UIManager.prototype.accceptDialog = function() {
  document.getElementById('custom-confirm').classList.remove('hidden');
};

UIManager.prototype.loading = function(isStart) {
  if (isStart == false) {
    document.getElementById('modal-loading').classList.add('hidden');
    return;
  }
  document.getElementById('modal-loading').classList.remove('hidden');
  document.getElementById('modal-loading').style.marginTop = 0 + 'px';
  document.getElementById('loading-container').style.marginTop =
    (document.getElementById('modal-loading').clientHeight/2 - 50) + 'px';
};

UIManager.prototype.updateWifiCode = function(ipAddress) {
  if(!ipAddress || ipAddress == '0.0.0.0') {
    document.getElementById('wifi-connect-number').textContent = 'Unknown';
    document.getElementById('wifi-status').classList.remove('connected');
  } else {
    var ip = ipAddress.split('.');
    var dataArray = new ArrayBuffer(4);
    var int8Array = new Uint8Array(dataArray);
    var int32Array = new Uint32Array(dataArray);
    int8Array[0] = ip[0];
    int8Array[1] = ip[1];
    int8Array[2] = ip[2];
    int8Array[3] = ip[3];
    document.getElementById('wifi-connect-number').textContent = int32Array[0];
    document.getElementById('wifi-status').classList.add('connected');
  }
};

UIManager.prototype.showConnectedPage = function(flag) {
  if (!flag) {
    this.connectedPage.classList.add('hidden');
    this.unconnectedPage.classList.remove('hidden');
    document.getElementById('custom-confirm').classList.add('hidden');
  } else {
    this.connectedPage.classList.remove('hidden');
    this.unconnectedPage.classList.add('hidden');
    document.getElementById('custom-confirm').classList.add('hidden');
  }
};

exports.UIManager = UIManager;

})(window);
