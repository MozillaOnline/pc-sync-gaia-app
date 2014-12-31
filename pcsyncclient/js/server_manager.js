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

  this.started = false;
};

ServerManager.prototype.start = function() {
  if (this.started) {
    console.warn('Server manager is running.');
    return;
  }

  this.started = true;

  this.createServer();
};

ServerManager.prototype.stop = function() {
  if (!this.started) {
    console.warn('Server manager has been stopped.');
    return;
  }

  this.started = false;

  if (this.dataSocketWrapper) {
    this.dataSocketWrapper.socket.close();
    this.dataSocketWrapper = null;
  }

  if (this.mainSocketWrapper) {
    this.mainSocketWrapper.socket.close();
    this.mainSocketWrapper = null;
  }

  if (this.server) {
    this.server.close();
    this.server = null;
  }
};

ServerManager.prototype.createServer = function() {
  var server = this.server =
    window.navigator.mozTCPSocket.listen(this.port, {binaryType: 'arraybuffer'},
                                         this.backlog);
    if (!server) {
      console.log('server is empty.');
    }

  server.onconnect = function(event) {
    var dataJson = {
      id: 0,
      type: CMD_TYPE.connected,
      command: 0,
      result: 0,
      datalength: 0,
      subdatalength: 0
    };

    if (!this.mainSocketWrapper) {
      console.log('create main socket');
      this.mainSocketWrapper = new TCPSocketWrapper({
        socket: event,
        onerror: function() {
          console.log('error occured in main socket.');
          this.mainSocketWrapper = null;
          this.app.uiManager.showConnectedPage(false);
          this.app.stop();
        }.bind(this),
        onclose: function() {
          console.log('main socket closed.');
          this.mainSocketWrapper = null;
          this.app.uiManager.showConnectedPage(false);
          if (this.dataSocketWrapper) {
            this.dataSocketWrapper.socket.close();
            this.dataSocketWrapper = null;
          }
        }.bind(this)
      });

      // Main socket connected
      this.mainSocketWrapper.send(dataJson, null);

      // Main socket connecting rejected
      if (!this.app.uiManager.confirm()) {
        dataJson.type = CMD_TYPE.rejected;
        this.mainSocketWrapper.send(dataJson, null);
        this.mainSocketWrapper.socket.close();
        this.mainSocketWrapper = null;
        return;
      }

      // Main socket connecting accepted.
      dataJson.type = CMD_TYPE.accepted;
      this.mainSocketWrapper.send(dataJson, null);

      this.app.uiManager.showConnectedPage(true);
    } else if (!this.dataSocketWrapper) {
      console.log('create data socket');
      this.dataSocketWrapper = new TCPSocketWrapper({
        socket: event,
        onclose: function() {
          console.log('data socket closed.');
        },
        onmessage:
          this.app.handlersManager.handleMessage.bind(this.app.handlersManager),
      });

      this.dataSocketWrapper.send(dataJson, null);
    }
  }.bind(this);

  // Error occured in tcp server.
  server.onerror = function(event) {
    console.log('Error occured when creating server in ServerManager.');
    this.app.stop();
    this.app.uiManager.showConnectedPage(false);
  }.bind(this);
};

exports.ServerManager = ServerManager;

})(window);
