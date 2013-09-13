/*------------------------------------------------------------------------------------------------------------
 *File Name: Background.js
 *Created By: dxue@mozilla.com
 *Description: Create TCP socket server
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

var backgroundService = {
  PORT: 10010,
  BACKLOG: -1,
  OPTIONS: {
    binaryType: 'arraybuffer'
  },

  createSocketServer: function() {
    try {
      var tcpServer = window.navigator.mozTCPSocket.listen(this.PORT, this.OPTIONS, this.BACKLOG);
      if (tcpServer) {
        tcpServer.onconnect = function(event) {
          var deviceStatus = document.getElementById('menuItem-device-unconnected');
          if(deviceStatus){
            deviceStatus.textContent = navigator.mozL10n.get('device-connected');
          }
          new TCPSocketWrapper({
            socket: event,
            onmessage: handleMessage,
            onclose: function (){
              var deviceStatus = document.getElementById('menuItem-device-unconnected');
              if(deviceStatus){
                deviceStatus.textContent = navigator.mozL10n.get('device-unconnected');
              }
            }
          });
        };
        var wifiConnectCode = document.getElementById('menuItem-wifi-connect-number');
        if(wifiConnectCode){
          if ('mozWifiManager' in navigator) {
            var gWifiManager = navigator.mozWifiManager;
            var updateNetInfo = function() {
              console.log('Background.js updateNetInfo');
              var info = gWifiManager.connectionInformation;
              if(info && info.ipAddress) {
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
        }
      } else {
        console.log('Background.js listen failed');
      }
    } catch (e) {
      console.log('Background.js createSocketServer failed: ' + e);
    }
  }
};

window.addEventListener('load', function startup(evt) {
  backgroundService.createSocketServer();
});
  
window.addEventListener('localized', function localized() {
  // This will be called during startup, and any time the languange is changed

  // Set the 'lang' and 'dir' attributes to <html> when the page is translated
  document.documentElement.lang = navigator.mozL10n.language.code;
  document.documentElement.dir = navigator.mozL10n.language.direction;

  // Look for any iframes and localize them - mozL10n doesn't do this
  Array.prototype.forEach.call(document.querySelectorAll('iframe'),
    function forEachIframe(iframe) {
      var doc = iframe.contentDocument;
      doc.documentElement.lang = navigator.mozL10n.language.code;
      doc.documentElement.dir = navigator.mozL10n.language.direction;
      navigator.mozL10n.translate(doc.body);
    }
  );

  // Also look for not-downloaded-message and re-translate the date message.
  // More complex because the argument to the l10n string is itself a formatted
  // date using l10n.
  Array.prototype.forEach.call(
    document.getElementsByClassName('not-downloaded-message'),
    function(element) {
      if (!(element.dataset.l10nArgs && element.dataset.l10nId &&
            element.dataset.l10nDate)) {
        return;
      }
      var args = JSON.parse(element.dataset.l10nArgs);
      var format = navigator.mozL10n.get(element.dataset.l10nDateFormat);
      var date = new Date(element.dataset.l10nDate);
      args.date = Utils.date.format.localeFormat(date, format);

      navigator.mozL10n.localize(element, element.dataset.l10nId, args);
    }
  );
});

/*
document.addEventListener('mozvisibilitychange', function() {
  console.log('Background.js document.mozHidden: ' + document.mozHidden);
  if (document.mozHidden) {
    confirm("123");
  } else {
  }
});*/
