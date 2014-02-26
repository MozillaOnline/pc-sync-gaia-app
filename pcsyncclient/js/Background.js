/*------------------------------------------------------------------------------------------------------------
 *File Name: Background.js
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
var KEYNAME_USBSTORAGE = 'usbStorage';
var KEYNAME_REMOTEDEBUGGER = 'remoteDebugger';
var KEYNAME_LOCKSCREEN = 'lockScreen';
var KEYNAME_SCREENTIMEOUT = 'screenTimeout';
var tcpServer;
var socketWrapper;
var currentRegion;
var self;

var backgroundService = {

  init: function() {
    self = this;
    self.checkSystemSettings();
  },

  checkSystemSettings: function () {
    self.getSystemSettings( function (systemSettings) {
      if ( systemSettings['devtools.debugger.remote-enabled'] != true
          || systemSettings['screen.timeout'] != 0
          || systemSettings['lockscreen.enabled'] != false
          || systemSettings['ums.enabled'] != false) {
        self.showRegionById('summary-region');
      } else {
        self.showRegionById('unconnect-region');
      }
    });
  },

  getSystemSettings: function (callback) {
    var systemSettings = {
      'devtools.debugger.remote-enabled': null,
      'screen.timeout': null,
      'lockscreen.enabled': null,
      'ums.enabled': null
    };
    var lock = navigator.mozSettings.createLock();
    var remoteDebugger = lock.get('devtools.debugger.remote-enabled');
    remoteDebugger.onsuccess = function () {
      systemSettings['devtools.debugger.remote-enabled'] = remoteDebugger.result['devtools.debugger.remote-enabled'];
      var screenTimeout = lock.get('screen.timeout');
      screenTimeout.onsuccess = function () {
        systemSettings['screen.timeout'] = screenTimeout.result['screen.timeout'];
        var lockscreen = lock.get('lockscreen.enabled');
        lockscreen.onsuccess = function () {
          systemSettings['lockscreen.enabled'] = lockscreen.result['lockscreen.enabled'];
          var ums = lock.get('ums.enabled');
          ums.onsuccess = function () {
            systemSettings['ums.enabled'] = ums.result['ums.enabled'];
            callback(systemSettings);
          }
        }
      }
    }
  },

  setSystemSettings: function(systemSettings, callback) {
    var lock = navigator.mozSettings.createLock();
    var remoteDebugger = lock.set({
      'devtools.debugger.remote-enabled': systemSettings['devtools.debugger.remote-enabled']
    });
    remoteDebugger.onsuccess = function () {
      var screenTimeout = lock.set({
        'screen.timeout': systemSettings['screen.timeout']
      });
      screenTimeout.onsuccess = function () {
        var usbStorage = lock.set({
          'ums.enabled': systemSettings['ums.enabled']
        });
        usbStorage.onsuccess = function () {
          var lockScreen = lock.set({
            'lockscreen.enabled': systemSettings['lockscreen.enabled']
          });
          lockScreen.onsuccess = function () {
            if (callback) {
              callback();
            }
          }
        }
      }
    }
  },

  getAppSettings: function (callback) {
    var appSettings = {
      'remoteDebugger': null,
      'screenTimeout': null,
      'lockScreen': null,
      'usbStorage': null
    };
    window.asyncStorage.getItem(KEYNAME_USBSTORAGE, function storage_getItem(usbStorage) {
      appSettings.usbStorage = usbStorage;
      window.asyncStorage.getItem(KEYNAME_REMOTEDEBUGGER, function storage_getItem(remoteDebugger) {
        appSettings.remoteDebugger = remoteDebugger;
        window.asyncStorage.getItem(KEYNAME_LOCKSCREEN, function storage_getItem(lockScreen) {
          appSettings.lockScreen = lockScreen;
          window.asyncStorage.getItem(KEYNAME_SCREENTIMEOUT, function storage_getItem(screenTimeout) {
            appSettings.screenTimeout = screenTimeout;
            callback(appSettings);
          });
        });
      });
    });
  },

  setAppSettings: function (appSettings) {
    for (var name in appSettings) {
      window.asyncStorage.setItem(name, appSettings[name]);
    }
  },

  showRegionById: function(id) {
    var views = ['help-region', 'settings-region', 'summary-region', 'unconnect-region', 'connected-region'];
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
      case 'settings-region':
        self.initSettingsRegion();
        break;
      case 'help-region':
        self.initHelpRegion();
        break;
    }

    views.forEach( function (viewId) {
      document.getElementById(viewId).hidden = !(viewId == id);
    });
    currentRegion = id;
  },

  showDialogById: function(id) {
    var dialogs = ['first-run-dialog'];
    switch (id) {
      case 'first-run-dialog':
        self.initFirstRunDialog();
        break;
    }
  },

  initSummaryRegion: function() {
    if (currentRegion == null) {
      self.getAppSettings( function (appSettings) {
        if (appSettings['remoteDebugger'] == null) {
          self.getSystemSettings( function (systemSettings) {
            var oriAppSettings = {
              'remoteDebugger': systemSettings['devtools.debugger.remote-enabled'],
              'screenTimeout': systemSettings['screen.timeout'],
              'lockScreen': systemSettings['lockscreen.enabled'],
              'usbStorage': systemSettings['ums.enabled']
            };
            self.setAppSettings(oriAppSettings);
          });
          self.showDialogById('first-run-dialog');
        }
      });
    } else {
      self.closeSocketServer();
    }
    document.getElementById('button-autoset').onclick = function () {
      self.setSettings(false, self.checkSystemSettings);
    }
    document.getElementById('summary-region-button-settings').onclick = function () {
      self.showRegionById('settings-region');
    };
    document.getElementById('summary-region-button-help').onclick = function () {
      self.showRegionById('help-region');
    };
  },

  initUnconnectRegion: function() {
    self.getWifiCode();
    self.createSocketServer();
    self.listenSettings(true);
    document.getElementById('unconnect-region-button-settings').onclick = function () {
      self.showRegionById('settings-region');
    };
    document.getElementById('unconnect-region-button-help').onclick = function () {
      self.showRegionById('help-region');
    };
  },

  initConnectedRegion: function() {
    document.getElementById('button-disconnect').onclick = function (event) {
      self.disconnect();
    };
  },

  initSettingsRegion: function() {
    var preRegion = currentRegion;
    document.getElementById('settings-region-back').onclick = function (event) {
      self.checkSystemSettings();
    };
    self.getAppSettings( function (appSettings) {
      var umsEnabledCheckBox = document.getElementById('settings-region-usb-storage');
      var remoteDebuggerEnabledCheckBox = document.getElementById('settings-region-remote-debugging');
      var lockScreenEnabledCheckBox = document.getElementById('settings-region-lock-screen');
      var screenTimeotEnabledSelect = document.getElementById('settings-region-screen-timeout');
      umsEnabledCheckBox.addEventListener('change', self);
      remoteDebuggerEnabledCheckBox.addEventListener('change', self);
      lockScreenEnabledCheckBox.addEventListener('change', self);
      screenTimeotEnabledSelect.addEventListener('change', self);
      umsEnabledCheckBox.checked = appSettings['usbStorage'];
      remoteDebuggerEnabledCheckBox.checked = appSettings['remoteDebugger'];
      lockScreenEnabledCheckBox.checked = appSettings['lockScreen'];
      for (var i = 0; i < screenTimeotEnabledSelect.options.length; i++) {
        if (screenTimeotEnabledSelect.options[i].value == appSettings['screenTimeout']) {
          screenTimeotEnabledSelect.selectedIndex = i;
          document.getElementById('settings-region-screen-timeout-button').textContent = screenTimeotEnabledSelect.options[i].textContent;
          break;
        }
      }
    });
  },

  initHelpRegion: function() {
    document.getElementById('help-region-back').onclick = function (event) {
      self.checkSystemSettings();
    };
  },

  initFirstRunDialog: function() {
    document.getElementById('first-run-dialog').hidden = false;
    document.getElementById('first-run-dialog-cancel').onclick = function (event) {
      document.getElementById('first-run-dialog').hidden = true;
    };
    document.getElementById('first-run-dialog-ok').onclick = function (event) {
      document.getElementById('first-run-dialog').hidden = true;
      self.setSettings(false, self.checkSystemSettings);
    };
  },

  handleEvent: function(evt) {
    var settingItem = evt.target;
    switch (evt.currentTarget.id) {
      case 'settings-region-usb-storage':
        self.setAppSettings({'usbStorage': settingItem.value});
        break;
      case 'settings-region-remote-debugging':
        self.setAppSettings({'remoteDebugger': settingItem.value});
        break;
      case 'settings-region-lock-screen':
        self.setAppSettings({'lockScreen': settingItem.value});
        break;
      case 'settings-region-screen-timeout':
        self.setAppSettings({'screenTimeout': settingItem.value});
        for (var i = 0; i < screenTimeotEnabledSelect.options.length; i++) {
          if (screenTimeotEnabledSelect.options[i].value == settingItem.value) {
            screenTimeotEnabledSelect.selectedIndex = i;
            document.getElementById('settings-region-screen-timeout-button').textContent = screenTimeotEnabledSelect.options[i].textContent;
            break;
          }
        }
        break;
    }
  },

  setSettings: function (isReset, callback) {
    var systemSettings = {
      'devtools.debugger.remote-enabled': true,
      'screen.timeout': 0,
      'lockscreen.enabled': false,
      'ums.enabled': false
    };
    if (isReset) {
      self.getAppSettings( function(appSettings) {
        systemSettings['ums.enabled'] = appSettings['usbStorage'];
        systemSettings['devtools.debugger.remote-enabled'] = appSettings['remoteDebugger'];
        systemSettings['lockscreen.enabled'] = appSettings['lockScreen'];
        systemSettings['screen.timeout'] = appSettings['screenTimeout'];
        self.setSystemSettings(systemSettings, callback);
      });
    } else {
      self.setSystemSettings(systemSettings, callback);
    }
  },

  createSocketServer: function() {
    tcpServer = window.navigator.mozTCPSocket.listen(PORT, OPTIONS, BACKLOG);
    if (!tcpServer) {
      return;
    }
    tcpServer.onconnect = function(event) {
      var serverSocket = new TCPSocketWrapper({
        socket: event,
        onmessage: handleMessage,
        onclose: function() {
          self.listenSettings(false);
          self.disconnect();
          self.closeSocketServer();
          self.setSettings(true, self.checkSystemSettings);
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
  },

  getWifiCode: function() {
    var wifiConnectCode = document.getElementById('menuItem-wifi-connect-number');
    if (!wifiConnectCode) {
      return;
    }
    if ('mozWifiManager' in navigator) {
      var gWifiManager = navigator.mozWifiManager;
      var updateNetInfo = function() {
        debug('Background.js updateNetInfo');
        var info = gWifiManager.connectionInformation;
        if (info && info.ipAddress) {
          var ip = info.ipAddress.split('.');
          var dataArray = new ArrayBuffer(4);
          var int8Array = new Uint8Array(dataArray);
          var int32Array = new Uint32Array(dataArray);
          int8Array[0] = ip[0];
          int8Array[1] = ip[1];
          int8Array[2] = ip[2];
          int8Array[3] = ip[3];
          wifiConnectCode.textContent = int32Array[0];
        }
      };
      gWifiManager.connectionInfoUpdate = updateNetInfo;
      updateNetInfo();
    }
  },

  handleSettingsEvent: function(event) {
    self.listenSettings(false);
    if (currentRegion == 'connected-region') {
      self.disconnect();
    } else if (currentRegion == 'unconnect-region') {
      self.closeSocketServer();
      self.checkSystemSettings();
    }
  },

  listenSettings: function(isListening) {
    if (isListening) {
      navigator.mozSettings.addObserver('devtools.debugger.remote-enabled', self.handleSettingsEvent);
      navigator.mozSettings.addObserver('screen.timeout', self.handleSettingsEvent);
      navigator.mozSettings.addObserver('lockscreen.enabled', self.handleSettingsEvent);
      navigator.mozSettings.addObserver('ums.enabled', self.handleSettingsEvent);
    } else {
      navigator.mozSettings.removeObserver('devtools.debugger.remote-enabled', self.handleSettingsEvent);
      navigator.mozSettings.removeObserver('screen.timeout', self.handleSettingsEvent);
      navigator.mozSettings.removeObserver('lockscreen.enabled', self.handleSettingsEvent);
      navigator.mozSettings.removeObserver('ums.enabled', self.handleSettingsEvent);
    }
  },
};

window.addEventListener('load', function startup(evt) {
  backgroundService.init();
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