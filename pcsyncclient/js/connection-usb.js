
var Connection_usb = {
	PORT: 10010,
	BACKLOG: -1,
	options: { binaryType: 'string' },
	server: null,
	retcallback: null,
	acceptsock: null,
	
	createSocketserver: function (callback){
		this.retcallback = callback;
		this.closeSocketserver();
		this.server = window.navigator.mozTCPSocket.listen(this.PORT, this.options, this.BACKLOG);
		if(this.server){
			this.server.onaccept = function(socket) {
				if (Connection_usb.acceptsock) {
					Connection_usb.acceptsock.close();
				}
				Connection_usb.acceptsock = socket;
				Client_message.init(Connection_usb.retcallback, Connection_usb.acceptsock);
				Connection_usb.acceptsock.ondata = function(event) {
					Client_message.handleMessage(event.data);
				};
				Connection_usb.acceptsock.onclose = function(event) {
					Connection_usb.closeSocketserver();
				};
				Connection_usb.retcallback(0);
			};
		}
		else{
			this.retcallback('create-socketserver');
		}
	},
	
	closeSocketserver: function (){
		if (this.server) {
			this.server.close();
			this.server = null;
		}
	}
};

