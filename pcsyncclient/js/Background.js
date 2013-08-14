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

window.addEventListener('localized', function onlocalized() {
  // Set the 'lang' and 'dir' attributes to <html> when the page is translated
  document.documentElement.lang = navigator.mozL10n.language.code;
  document.documentElement.dir = navigator.mozL10n.language.direction;
});

/*
document.addEventListener('mozvisibilitychange', function() {
  console.log('Background.js document.mozHidden: ' + document.mozHidden);
  if (document.mozHidden) {
    confirm("123");
  } else {
  }
});*/
