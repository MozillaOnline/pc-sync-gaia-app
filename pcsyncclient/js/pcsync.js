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
var socketWrapper;
var currentRegion;
var self;

var photoDB = null;
var musicDB = null;
var videoDB = null;
var isReadyPhotoDB = false;
var isReadyMusicDB = false;
var isReadyVideoDB = false;
var listenSocket = null;
var listenJsonCmd = null;
var listenSendCallback = null;

var pcsync = {

  init: function() {
    self = this;
    self.showRegionById('unconnect-region');
  },

  loading: function() {
    document.getElementById('modal-loading').classList.remove('hidden');
    document.getElementById('modal-loading').style.marginTop = 0 + 'px';
    document.getElementById('loading-container').style.marginTop = (document.getElementById('modal-loading').clientHeight/2 - 50) + 'px';
  },

  getWifiCode: function() {
    var ipAddress = '0.0.0.0';
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

  initUnconnectRegion: function() {
    self.loading();
    self.disconnect();
    self.closeSocketServer();
    navigator.mozContacts.oncontactchange = null;
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
    listenSocket = null;
    listenJsonCmd = null;
    listenSendCallback = null;
    self.createSocketServer();
    self.getWifiCode();
    document.getElementById('button-restart-service').onclick = function () {
      self.showRegionById('unconnect-region');
    };
    if (navigator.mozL10n.language.code == 'zh-CN') {
      document.getElementById("unconnect-view-help").href = "http://os.firefox.com.cn/project/ffos-assistant/help-cn.html";
    } else {
      document.getElementById("unconnect-view-help").href = "http://os.firefox.com.cn/project/ffos-assistant/help-en.html";
    }
  },

  initConnectedRegion: function() {
    document.getElementById('button-disconnect').onclick = function (event) {
      self.showRegionById('unconnect-region');
    };
  },

  createSocketServer: function() {
    debug('createSocketServer: ' + tcpServer);
    tcpServer = window.navigator.mozTCPSocket.listen(PORT, OPTIONS, BACKLOG);
    if (!tcpServer) {
      debug('Can not init application!');
      exit(0);
    }
    debug('tcpServer: ' + tcpServer);
    tcpServer.onconnect = function(event) {
      debug('tcpServer is connect !!!!!!!!!!!!!!');
      var serverSocket = new TCPSocketWrapper({
        socket: event,
        onmessage: handleMessage,
        onerror: function() {
          if ( currentRegion != 'unconnect-region')
            self.showRegionById('unconnect-region');
        },
        onclose: function() {
          if ( currentRegion != 'unconnect-region')
            self.showRegionById('unconnect-region');
        }
      });
      if (!socketWrapper) {
        socketWrapper = serverSocket;
        self.showRegionById('connected-region');
        var dataJson = {
          id: 0,
          type: CMD_TYPE.connected,
          command: 0,
          result: 0,
          datalength: 0
        };
        socketWrapper.send(dataJson, null);
      }
    };
    tcpServer.onerror = function(event) {
      debug('tcpServer error!');
      if ( currentRegion != 'unconnect-region')
        self.showRegionById('unconnect-region');
    }
  },

  closeSocketServer: function() {
    if(tcpServer) {
      debug('closeSocketServer!');
      tcpServer.close();
      tcpServer = null;
    }
  },

  disconnect: function() {
    if(socketWrapper) {
      var dataJson = {
        id: 0,
        type: CMD_TYPE.disconnect,
        command: 0,
        result: 0,
        datalength: 0
      };
      socketWrapper.send(dataJson, null);
      socketWrapper.socket.close();
      socketWrapper = null;
    }
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