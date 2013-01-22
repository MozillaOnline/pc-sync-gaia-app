
var Action_sms = {
	sendfunc: null,
	
	init:function (data){
		this.sendfunc = data;
	},
	
	request: function (data){
		dump('pcsync action-sms.js line10 :' + JSON.stringify(data));
		switch (data.command) {
			case "sendsms":{
				this.sendsms(data.id, data.command,data.data);
				break;
			}
			case "deletesms":{
				this.deletesms(data.id, data.command,data.data);
				break;
			}
			case "getMessage":{
				this.getMessage(data.id, data.command,data.data);
				break;
			}
			case "getMessages":{
				this.getMessages(data.id, data.command,data.data);
				break;
			}
			case "markMessageRead":{
				this.markMessageRead(data.id, data.command,data.data);
				break;
			}
			default:
				dump('pcsync action-sms.js line33 :' + data);
				break;
		}
	},
	
	response: function (data){
		switch (data.command) {
			default:
				dump('pcsync action-sms.js line41 :' + data);
				break;
		}
	},
	
	success: function (resultid,resultcommand,resultdata){
		var smsdata = {
			action: 'response',
			id: resultid,
			command: resultcommand,
			status: 200,
			data: resultdata
		};
		Action_sms.sendresponse(smsdata);
	},
	
	error: function (resultid,resultcommand,resultdata){
		var smsdata = {
			action: 'response',
			id: resultid,
			command: resultcommand,
			status: 201,
			data: resultdata
		};
		Action_sms.sendresponse(smsdata);
	},
	
	sendresponse: function (data){
		if(this.sendfunc){
			this.sendfunc.send(JSON.stringify(data));
		}
	},
	
	sendsms: function (requestid,requestcommand, requestdata){
		var request = window.navigator.mozSms.send(requestdata.id, requestdata.message);
		request.onsuccess = function sendCallback() {
			Action_sms.success(requestid,requestcommand,request.result);
		};
		request.onerror = function sendCallback() {
			Action_sms.error(requestid,requestcommand, request.result);
		};
	},
	
	deletesms: function (requestid,requestcommand, requestdata){
		var request = window.navigator.mozSms.delete(requestdata);
		request.onsuccess = function deleteCallback(event) {
			if (event.target.result) {
				Action_sms.success(requestid,requestcommand,event.target.result);
			} else {
				Action_sms.error(requestid,requestcommand, event.target.result);
			}
			
		};
		request.onerror = function deleteCallback(event) {
			Action_sms.error(requestid,requestcommand, event.target.error.name);
		};
	},
	
	getMessage: function (requestid,requestcommand, requestdata){
		var request = window.navigator.mozSms.getMessage(requestdata);
		request.onsuccess = function getMessageCallback() {
			Action_sms.success(requestid,requestcommand,request.result);
		};
		request.onerror = function getMessageCallback() {
			Action_sms.error(requestid,requestcommand, request.result);
		};
	},
	
	getMessages: function (requestid,requestcommand, requestdata){
		var filter = new MozSmsFilter();
		var request = window.navigator.mozSms.getMessages(filter, false);
		request.onsuccess = function(event) {
			var cursor = event.target.result;
			if (cursor.message) {
				// Another message found
				Action_sms.success(requestid,requestcommand,cursor.message);
			} else {
				// No messages found as expected
			}
		};

		request.onerror = function(event) {
			Action_sms.error(requestid,requestcommand, event.target.error.name);
		};
	},
	
	markMessageRead: function (requestid,requestcommand, requestdata){
		var request = window.navigator.mozSms.markMessageRead(requestdata,false);
		request.onsuccess = function getMessageCallback(event) {
			Action_sms.success(requestid,requestcommand,event.target.result);
		};
		request.onerror = function getMessageCallback(event) {
			Action_sms.error(requestid,requestcommand, event.target.error.name);
		};
	}
	
};

