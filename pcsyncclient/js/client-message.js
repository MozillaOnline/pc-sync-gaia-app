
var Client_message = {
	acceptsock: null,
	
	init: function (sockethandle){
		dump('pcsync client-message.js line6 :' + sockethandle);
		this.acceptsock = sockethandle;
	},
	
	handleMessage: function (data){
		var message = null;
		dump('pcsync client-message.js line11 :' + JSON.stringify(data));
		try {
			message = JSON.parse(data);
		} 
		catch (e) {
			dump('pcsync client-message.js line16 :' + data);
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
				dump('pcsync client-message.js line27 :' + data);
				break;
		}
	},
	
	requestmessage: function (data){
		switch (data.target) {
			case "contact":
				dump('pcsync client-message.js line35 :' + this.acceptsock);
				Action_contact.init(this.acceptsock);
				Action_contact.request(data);
				break;
			case "sms":
				Action_sms.init(this.acceptsock);
				Action_sms.request(data);
				break;
			default:
				dump('pcsync client-message.js line43 :' + data);
				break;
		}
	},
	
	responsemessage: function (data){
		switch (data.target) {
			default:
				dump('pcsync client-message.js line51 :' + data);
				break;
		}
	}
};

