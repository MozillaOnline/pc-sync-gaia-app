
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
			Client_message.init(Connection_internet.retcallback, Connection_internet.ws);
		};
		this.ws.onmessage = function(event) {
			Client_message.handleMessage(event.data);
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
	}
};

