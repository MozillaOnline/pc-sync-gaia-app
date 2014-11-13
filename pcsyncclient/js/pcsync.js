/*------------------------------------------------------------------------------------------------------------
 *File Name: pcsync.js
 *Created By: dxue@mozilla.com
 *Description: Create TCP socket server
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/
let DEBUG = 0;
function debug(s) {
  if (DEBUG) {
    console.log("-*- pcsyncclient: " + s + "\n");
  }
}

var PORT = 25679;
var BACKLOG = -1;
var OPTIONS = { binaryType: 'arraybuffer' };
var tcpServer;
var socketWrappers = {};
var serverSocket = 'server';
var listenSocket = 'listen';
var currentRegion;
var self;

var photoDB = null;
var musicDB = null;
var videoDB = null;
var isReadyPhotoDB = false;
var isReadyMusicDB = false;
var isReadyVideoDB = false;
var mainSocketConnected = false;
var listenSocketConnected = false;
var ipAddress = '0.0.0.0';

var pcsync = {
  init: function() {
    self = this;
    self.getWifiCode();
    document.getElementById("help-general-back").onmousedown =
    document.getElementById("help-general-back").ontouchstart = function() {
      this.classList.add('touchover');
    };
    document.getElementById("help-general-back").onmouseup =
    document.getElementById("help-general-back").ontouchend = function() {
      this.classList.remove('touchover');
      document.getElementById('modal-help-general').classList.add('hidden');
    };
    document.getElementById("help-usb-back").onmousedown =
    document.getElementById("help-usb-back").ontouchstart = function() {
      this.classList.add('touchover');
    };
    document.getElementById("help-usb-back").onmouseup =
    document.getElementById("help-usb-back").ontouchend = function() {
      this.classList.remove('touchover');
      document.getElementById('modal-help-usb').classList.add('hidden');
    };
    self.showRegionById('unconnect-region');
  },

  loading: function() {
    document.getElementById('modal-loading').classList.remove('hidden');
    document.getElementById('modal-loading').style.marginTop = 0 + 'px';
    document.getElementById('loading-container').style.marginTop = (document.getElementById('modal-loading').clientHeight/2 - 50) + 'px';
  },

  getWifiCode: function() {
    try{
      self.loading();
      ipAddress = '0.0.0.0';
      var PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection;
      var pc = new PeerConnection();
      var firstCon = true;
      var wifi_enabled = true;
      pc.onicecandidate = function (e) {
        debug(e);
        if (e.candidate && firstCon) {
          firstCon = false;
          var ipString = e.candidate.candidate.split(' ');
          if (ipString.length == 8) {
            ipAddress = ipString[4];
          } else if (ipString.length == 12) {
            ipAddress = ipString[9];
          }
        }
        self.updateWifiCode(ipAddress);
      };
      pc.oniceconnectionstatechange = function (e) {
        debug(e);
        wifi_enabled = false;
      }
      pc.createDataChannel('DataChannel');
      pc.createOffer(function(desc){
          debug(desc.sdp);
          if (desc && desc.sdp && wifi_enabled) {
            var startIndex = desc.sdp.indexOf('c=', 0);
            var endIndex = desc.sdp.indexOf('\r\n', startIndex);
            var tmpString = desc.sdp.substring(startIndex + 2, endIndex);
            //debug(desc.sdp);
            var ipString = tmpString.split(' ');
            if (ipString[2] == '0.0.0.0') {
              pc.setLocalDescription(desc);
            } else {
              ipAddress = ipString[2];
              self.updateWifiCode(ipAddress);
            }
          } else {
            self.updateWifiCode(ipAddress);
          }
        }, function(error){
          self.updateWifiCode(ipAddress);
      });
    } catch (e) {
      debug(e);
      wifi_enabled = false;
      self.updateWifiCode(ipAddress);
    }
  },

  updateWifiCode: function(ipAddress) {
    /*document.getElementById('wifi-connect-number').textContent = ipAddress;*/
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
    document.getElementById('modal-loading').classList.add('hidden');
  },

  showRegionById: function(id) {
    var views = ['unconnect-region', 'connected-region'];
    currentRegion = id;
    switch (id) {
      case 'unconnect-region':
        self.initUnconnectRegion();
        break;
      case 'connected-region':
        self.initConnectedRegion();
        break;
    }
    views.forEach( function (viewId) {
      document.getElementById(viewId).hidden = !(viewId == id);
    });
  },

  createSocketServer: function() {
    tcpServer = window.navigator.mozTCPSocket.listen(PORT, OPTIONS, BACKLOG);
    if (!tcpServer) {
      debug('Can not init application!');
      exit(0);
    }
    debug('tcpServer: ' + tcpServer);
    tcpServer.onconnect = function(event) {
      if (!mainSocketConnected) {
        var server = new TCPSocketWrapper({
          socket: event,
          onmessage: handleMessage,
          onerror: function() {
            if (mainSocketConnected) {
              mainSocketConnected = false;
              self.showRegionById('unconnect-region');
            }
          },
          onclose: function() {
            if (mainSocketConnected){
              mainSocketConnected = false;
              self.showRegionById('unconnect-region');
            }
          }
        });
        socketWrappers[serverSocket] = server;
        var dataJson = {
          id: 0,
          type: CMD_TYPE.connected,
          command: 0,
          result: 0,
          datalength: 0,
          subdatalength: 0
        };
        server.send(dataJson, null);
        mainSocketConnected = true;
      } else if (!listenSocketConnected){
        listenSocketConnected = true;
        var listen = new TCPSocketWrapper({
          socket: event
        });
        socketWrappers[listenSocket] = listen;
        self.showRegionById('connected-region');
      }
    };
    tcpServer.onerror = function(event) {
      debug('tcpServer error!');
      if ( currentRegion != 'unconnect-region')
        self.showRegionById('unconnect-region');
    }
  },

  initUnconnectRegion: function() {
    self.disconnect();
    self.closeSocketServer();
    if (photoDB) {
      photoDB.oncreated = null;
      photoDB.ondeleted = null;
      photoDB.onscanend = null;
      photoDB.cancelScan();
    }
    if (musicDB) {
      musicDB.oncreated = null;
      musicDB.ondeleted = null;
      musicDB.onscanend = null;
      musicDB.cancelScan();
    }
    if (videoDB) {
      videoDB.oncreated = null;
      videoDB.ondeleted = null;
      videoDB.onscanend = null;
      videoDB.cancelScan();
    }
    socketWrappers = {};
    self.createSocketServer();
    document.getElementById('button-restart-service').onclick = function () {
      self.getWifiCode();
      self.showRegionById('unconnect-region');
    };
    document.getElementById('unconnect-view-help').onclick = function () {
      document.getElementById('modal-help-general').classList.remove('hidden');
    };
    document.getElementById('unconnect-view-usb').onclick = function () {
      document.getElementById('modal-help-usb').classList.remove('hidden');
    };
  },

  initConnectedRegion: function() {
    document.getElementById('button-disconnect').onclick = function (event) {
      self.showRegionById('unconnect-region');
    };
  },

  closeSocketServer: function() {
    if(tcpServer) {
      debug('closeSocketServer!');
      tcpServer.close();
      tcpServer = null;
    }
  },

  disconnect: function() {
    if(socketWrappers[serverSocket]) {
      var dataJson = {
        id: 0,
        type: CMD_TYPE.disconnect,
        command: 0,
        result: 0,
        datalength: 0,
        subdatalength: 0
      };
      socketWrappers[serverSocket].send(dataJson, null);
      socketWrappers[serverSocket].socket.close();
      mainSocketConnected = false;
    }
    if(socketWrappers[listenSocket]) {
      socketWrappers[serverSocket].socket.close();
      listenSocketConnected = false;
    }
    socketWrappers = {};
  }
};

window.addEventListener('load', function startup(evt) {
  pcsync.init();
});

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