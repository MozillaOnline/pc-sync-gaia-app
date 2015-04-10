'use strict';

(function(exports) {

var ServerManager = function(app) {
  this.app = app;
  this.server = null;
  this.mainSocketWrapper = null;
  this.dataSocketWrapper = null;
  this.port = 25679;
  this.backlog = -1;
  this.options = {
    binaryType: 'arraybuffer'
  };
};

ServerManager.prototype.init = function() {
  this.createServer();
};

ServerManager.prototype.restart = function() {
  this.reset();

  if (this.server) {
    this.server.close();
    this.server = null;
  }
  this.createServer();
};

ServerManager.prototype.createServer = function() {
  var server = this.server =
    window.navigator.mozTCPSocket.listen(this.port, {binaryType: 'arraybuffer'},
                                         this.backlog);
  if (!server) {
    console.log('Create TCP server socket failed.');
    window.close();
    return;
  }

  server.onconnect = function(event) {
    var dataJson = {
      id: CMD_ID.app_connected,
      flag: CMD_TYPE.app_connected,
      datalength: 0
    };

    if (!this.mainSocketWrapper) {
      console.log('Create main socket.');
      this.mainSocketWrapper = new TCPSocketWrapper({
        socket: event,
        onerror: function() {
          console.log('Error occured in main socket.');
          this.reset();
        }.bind(this),
        onclose: function() {
          console.log('Main socket closed.');
          this.reset();
        }.bind(this)
      });

      // Main socket connected
      this.mainSocketWrapper.send(dataJson, null);

      var evt = new CustomEvent(CMD_TYPE.app_connected, {
        'detail': {
          'id': CMD_ID.app_connected,
          'data': null
        }
      });
      document.dispatchEvent(evt);

    } else if (!this.dataSocketWrapper) {
      console.log('Create data socket');
      this.dataSocketWrapper = new TCPSocketWrapper({
        socket: event,
        onerror: function() {
          console.log('Error occured in data socket.');
          this.dataSocketWrapper = null;
        }.bind(this),
        onclose: function() {
          console.log('Data socket closed.');
          this.dataSocketWrapper = null;
        }.bind(this),
        onmessage:
          this.app.handlersManager.handleMessage.bind(this.app.handlersManager)
      });
    }
  }.bind(this);

  // Error occured in tcp server.
  server.onerror = function(event) {
    console.log('Error occured in tcp server socket.');
    this.restart();
  }.bind(this);
};

ServerManager.prototype.reset = function() {
  if (this.dataSocketWrapper) {
    this.dataSocketWrapper.socket.close();
    this.dataSocketWrapper = null;
  }
  if (this.mainSocketWrapper) {
    this.mainSocketWrapper.socket.close();
    this.mainSocketWrapper = null;
  }
  this.app.uiManager.showConnectedPage(false);
  this.app.handlersManager.reset();
};

// Send data from dataSocket.
ServerManager.prototype.send = function(cmd, dataArray) {
  if (this.dataSocketWrapper) {
    this.dataSocketWrapper.send(cmd, dataArray);
  }
};

// Send data from mainSocket.
ServerManager.prototype.update = function(cmd, dataArray) {
  if (this.mainSocketWrapper) {
    this.mainSocketWrapper.send(cmd, dataArray);
  }
};

exports.ServerManager = ServerManager;

})(window);
