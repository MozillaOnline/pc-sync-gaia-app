dump("pcsync background");
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
	
	createSocketserver: function (){
		dump("pcsync server in create");
		this.server = window.navigator.mozTCPSocket.listen(this.PORT, this.options, this.BACKLOG);
		if(this.server){
			this.server.onaccept = function(socket) {
				dump("pcsync connected");
				Client_message.init(socket);
				socket.ondata = function(event) {
					Client_message.handleMessage(event.data);
				};
				socket.onclose = function(event) {
					//Connection_usb.createSocketserver(Connection_usb.retcallback);
					dump("pcsync disconnected");
				};
			};
		}
		else{
			dump("pcsync create listen error");
		}
		
	}
};

Connection_usb.createSocketserver();
