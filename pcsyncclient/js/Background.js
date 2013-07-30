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
          var deviceStatus = document.getElementById('menuItem-icc');
          if(deviceStatus){
            deviceStatus.textContent = "Connected";
          }
          console.log('Background.js listen onconnect ' + event);
          new TCPSocketWrapper({
            socket: event,
            onmessage: handleMessage,
            onclose: function (){
              var deviceStatus = document.getElementById('menuItem-icc');
              if(deviceStatus){
                deviceStatus.textContent = "Unconnect";
              }
            }
          });
        };
      } else {
        console.log('Background.js listen failed');
      }
    } catch (e) {
      console.log('Background.js createSocketServer failed: ' + e);
    }
  }
};

backgroundService.createSocketServer();
/*
document.addEventListener('mozvisibilitychange', function() {
  console.log('Background.js document.mozHidden: ' + document.mozHidden);
  if (document.mozHidden) {
    confirm("123");
  } else {
  }
});*/
