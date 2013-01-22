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
dump("pcsync USB connected");

});

usbm.addEventListener("detachdevice", function () {
// ...
dump("pcsync USB disconnected");

});

usbm.claimDevice(descriptor);
*/

var Connection_usb = {
	PORT: 10010,
	BACKLOG: -1,
	options: { binaryType: 'string' },
	server: null,
	acceptsock: null,
	
	createSocketserver: function (){
		dump('pcsync background.js line36');
		this.server = window.navigator.mozTCPSocket.listen(this.PORT, this.options, this.BACKLOG);
		if(this.server){
			this.server.onaccept = function(socket) {
				dump('pcsync background.js line40 :' + socket);
				Connection_usb.acceptsock = socket;
				Client_message.init(Connection_usb.acceptsock);
				Connection_usb.acceptsock.ondata = function(event) {
					Client_message.handleMessage(event.data);
				};
				Connection_usb.acceptsock.onclose = function(event) {
					//Connection_usb.createSocketserver(Connection_usb.retcallback);
					dump('pcsync background.js line48');
				};
			};
		}
		else{
			dump('pcsync background.js line53');
		}
		
	}
};

Connection_usb.createSocketserver();
