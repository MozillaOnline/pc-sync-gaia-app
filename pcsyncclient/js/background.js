/*
var usbm = new MozUSBManager();

var descriptor = {
  deviceClass: n,
  deviceSubClass: n,
  deviceProtocol: n,
  deviceVendor: n,
  deviceProduct: n
};

usbm.addEventListener("attachdevice", function () {
// ...
debug("pcsync USB connected");

});

usbm.addEventListener("detachdevice", function () {
// ...
debug("pcsync USB disconnected");

});

usbm.claimDevice(descriptor);
*/

var Connection_usb = {
  PORT: 10010,
  BACKLOG: -1,
  options: { binaryType: 'arraybuffer' },
  server: null,
  acceptsock: null,

  createSocketserver: function (){
    debug('pcsync background.js line36');
    this.server = window.navigator.mozTCPSocket.listen(this.PORT, this.options, this.BACKLOG);
    if(this.server){
      this.server.onaccept = function(socket) {
        debug('pcsync background.js line40 :' + socket);
        Connection_usb.acceptsock = socket;

        var messageHandler = new Client_message(socket);

        socket.ondata = function(event) {
          debug("Receive data: " + event.data);
          this.handleMessage(event.data);
          debug("Handle data!!!");
        }.bind(messageHandler);

        socket.onerror = function onerror(event) {
          debug('error occurs');
        };

        socket.ondrain = function ondrain(event) {
          debug('on drain');
        };

        socket.onclose = function(event) {
          //Connection_usb.createSocketserver(Connection_usb.retcallback);
          debug('pcsync background.js line49');
        }.bind(messageHandler);
      };
    }
    else{
      debug('pcsync background.js line53');
    }

  }
};

Connection_usb.createSocketserver();
