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
        tcpServer.onaccept = function(event) {
          new tcpServerHelper(event);
        };
      } else {
        debug('Background.js listen failed');
      }
    } catch (e) {
      debug('Background.js createSocketServer failed: ' + e);
    }
  }
};

backgroundService.createSocketServer();