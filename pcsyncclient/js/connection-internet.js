
var Connection_internet = {
	ws: null,
	retcallback: null,
	
	connectToServer: function (url, callback){
		this.retcallback = callback;
		window.WebSocket = window.WebSocket || window.MozWebSocket;
		this.ws = new WebSocket(url);
		this.ws.onopen = function() {
			var navigator = window.navigator;
			var registerdata = null;
			if ('mozWifiManager' in navigator){
				registerdata = navigator.mozWifiManager.macAddress;
			}
			else{
				registerdata = 'tempdata';
			}
			var register = {
				action: 'request',
				id: 0,
				target: 'init',
				command: 'register',
				data: registerdata
				};
			dump(registerdata);
			Connection_internet.ws.send(JSON.stringify(register));
			
		};
		this.ws.onmessage = function(event) {
			Connection_internet.handleMessage(event.data);
		};
		this.ws.onerror = function(event) {
			Connection_internet.retcallback('connect-failed');
		};
	},
	
	disconnectToServer: function (){
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	},
	
	handleMessage: function (data){
		var message = null;
		try {
			message = JSON.parse(data);
		} 
		catch (e) {
			dump("Parse error, received msg from mgmt: " + data);
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
				dump("handleMessage Received msg from mgmt: " + data);
				break;
		}
	},
	
	requestmessage: function (data){
		switch (data.target) {
			case "contact":
				Action_contact.init(this.ws);
				Action_contact.request(data);
				break;
			default:
				dump("requestmessage Received msg from mgmt: " + data);
				break;
		}
	},
	
	responsemessage: function (data){
		switch (data.command) {
			case "register":
				this.registerresponse(data);
				break;
			default:
				dump("responsemessage Received msg from mgmt: " + data);
				break;
		}
	},
	
	registerresponse: function (data){
		if(data.status == 200)
			this.retcallback(0);
		else
			this.retcallback('not-authorized');
	}
};

