
var Connection_usb = {
	PORT: 10010,
	BACKLOG: -1,
	options: { binaryType: 'arraybuffer' },
	server: null,
	retcallback: null,
	acceptsock: null,
	
	createSocketserver: function (callback){
		this.retcallback = callback;
		this.closeSocketserver();
		this.server = navigator.mozTCPSocket.listen(this.PORT, this.options, this.BACKLOG);
		if(this.server){
			this.server.onaccept = function(socket) {
				if (Connection_usb.acceptsock) {
					Connection_usb.acceptsock.close();
				}
				Connection_usb.acceptsock = socket;
				Connection_usb.acceptsock.ondata = function(event) {
					Connection_usb.handleMessage(event.data);
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
	},
	
	handleMessage: function (data){
		var message = null;
		try {
			message = JSON.parse(data);
		} 
		catch (e) {
			alert("Parse error, received msg from mgmt: " + data);
			return;
		}
		dump(JSON.stringify(message));
		switch (message.action) {
			case "request":
				this.requestmessage(message);
				break;
			case "response":
				this.responsemessage(message);
				break;
			default:
				alert("handleMessage Received msg from mgmt: " + data);
				break;
		}
	},
	
	requestmessage: function (data){
		switch (data.target) {
			case "contact":
				Action_contact.request(data);
				break;
			default:
				alert("requestmessage Received msg from mgmt: " + data);
				break;
		}
	},
	
	responsemessage: function (data){
		switch (data.command) {
			default:
				alert("responsemessage Received msg from mgmt: " + data);
				break;
		}
	}
};

