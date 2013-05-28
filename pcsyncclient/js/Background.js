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
          new TCPSocketWrapper({
            socket: event,
            onmessage: handleMessage
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



