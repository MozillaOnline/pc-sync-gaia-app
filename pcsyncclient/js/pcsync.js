/*------------------------------------------------------------------------------------------------------------
 *File Name: pcsync.js
 *Created By: dxue@mozilla.com
 *Description: Create TCP socket server
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/
let DEBUG = 1;
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

var pcsync = {

  init: function() {
    self = this;
    self.showRegionById('summary-region');
  },

  showRegionById: function(id) {
    var views = ['summary-region', 'unconnect-region', 'connected-region'];
    switch (id) {
      case 'summary-region':
        self.initSummaryRegion();
        break;
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
    currentRegion = id;
  },

  initSummaryRegion: function() {
    document.getElementById('button-start-service').onclick = function () {
      self.createSocketServer();
      self.showRegionById('unconnect-region');
    }
  },

  initUnconnectRegion: function() {
    document.getElementById('button-stop-service').onclick = function () {
      self.disconnect();
      self.closeSocketServer();
      self.showRegionById('summary-region');
    };
  },

  initConnectedRegion: function() {
    document.getElementById('button-disconnect').onclick = function (event) {
      self.disconnect();
      self.showRegionById('unconnect-region');
    };
  },

  createSocketServer: function() {
    tcpServer = window.navigator.mozTCPSocket.listen(PORT, OPTIONS, BACKLOG);
    if (!tcpServer) {
      console.log('tcpServer is null !!!!!!!!!!!!!!');
      self.disconnect();
      self.closeSocketServer();
      self.showRegionById('summary-region');
      return;
    }
    tcpServer.onconnect = function(event) {
      console.log('tcpServer is connect !!!!!!!!!!!!!!');
      var serverSocket = new TCPSocketWrapper({
        socket: event,
        onmessage: handleMessage,
        onerror: function() {
          self.disconnect();
          self.showRegionById('unconnect-region');
        },
        onclose: function() {
          self.disconnect();
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
      console.log('tcpServer is error !!!!!!!!!!!!!!');
      self.disconnect();
      self.closeSocketServer();
      self.showRegionById('summary-region');
    }
  },

  closeSocketServer: function() {
    if(tcpServer) {
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