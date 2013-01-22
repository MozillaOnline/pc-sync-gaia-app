
var Client_message = {
	acceptsock: null,
	
	init: function (sockethandle){
		acceptsock = sockethandle;
	},
	
	handleMessage: function (data){
		var message = null;
		dump(JSON.stringify(data));
		try {
			message = JSON.parse(data);
		} 
		catch (e) {
			dump("Parse error, received msg from mgmt: " + data);
			return;
		}
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
				Action_contact.init(this.acceptsock);
				Action_contact.request(data);
				break;
			case "sms":
				Action_sms.init(this.acceptsock);
				Action_sms.request(data);
				break;
			default:
				dump("requestmessage Received msg from mgmt: " + data);
				break;
		}
	},
	
	responsemessage: function (data){
		switch (data.target) {
			default:
				dump("responsemessage Received msg from mgmt: " + data);
				break;
		}
	}
};

