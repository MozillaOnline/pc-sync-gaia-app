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
  options: {
    binaryType: 'arraybuffer'
  },
  server: null,

  createSocketserver: function() {
    debug('pcsync background.js line34');
    this.server = window.navigator.mozTCPSocket.listen(this.PORT, this.options, this.BACKLOG);
    if (this.server) {
      this.server.onaccept = function(socket) {
        debug('pcsync background.js line38 :' + socket);
        new ConnectionHelper(socket);
      };
    } else {
      debug('pcsync background.js line43');
    }

  }
};

Connection_usb.createSocketserver();