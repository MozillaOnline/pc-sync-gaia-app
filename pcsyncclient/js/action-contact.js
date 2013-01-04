
var Action_contact = {
	formatmozContact: null,
	
	request: function (data){
		dump('xds4' + JSON.stringify(data));
		switch (data.command) {
			//all contacts
			case "getAllContacts":{
				this.getAllContacts(data.id, data.command);
				break;
			}
			case "clearContacts":{
				this.clearContacts(data.id, data.command);
				break;
			}
			//single contact
			case "getContact":{
				this.getContact(data.id, data.command,data.data);
				break;
			}
			case "removeContact":{
				this.removeContact(data.id, data.command,data.data);
				break;
			}
			case "addContact":{
				this.addContact(data.id, data.command,data.data);
				break;
			}
			case "updateContact":{
				this.updateContact(data.id, data.command,data.data);
				break;
			}
			//multi contacts
			case "getContacts":{
				this.getContacts(data.id, data.command,data.data);
				break;
			}
			case "removeContacts":{
				this.removeContacts(data.id, data.command,data.data);
				break;
			}
			case "addContacts":{
				this.addContacts(data.id, data.command,data.data);
				break;
			}
			case "updateContacts":{
				this.updateContacts(data.id, data.command,data.data);
				break;
			}
			default:
				alert("contactrequest Received msg from mgmt: " + data);
				break;
		}
	},
	
	response: function (data){
		switch (data.command) {
			default:
				alert("contactrequest Received msg from mgmt: " + data);
				break;
		}
	},
	
	success: function (resultid,resultcommand,resultdata){
		var contactdata = {
			action: 'response',
			id: resultid,
			command: resultcommand,
			status: 200,
			data: resultdata
		};
		dump(JSON.stringify(contactdata));
		Connection_internet.ws.send(JSON.stringify(contactdata));
		/*
		 * * alert(request.result[0].photo[0].size);
		 * */
	},
	
	error: function (resultid,resultcommand,resultdata){
		var contactdata = {
			action: 'response',
			id: resultid,
			command: resultcommand,
			status: 201,
			data: resultdata
		};
		dump(JSON.stringify(contactdata));
		Connection_internet.ws.send(JSON.stringify(contactdata));
	},
	
	format2mozContact: function (data){
		if(this.formatmozContact){
			//this.formatmozContact
			this.formatmozContact = null;
		}
		this.formatmozContact = new mozContact();
		this.formatmozContact.init(data);
	},
	//all contacts
	getAllContacts: function (requestid,requestcommand){
		var options = {
			sortBy: 'familyName',
			sortOrder: 'ascending'
		};
		var request = window.navigator.mozContacts.find(options);
		request.onsuccess = function findCallback() {
			Action_contact.success(requestid,requestcommand,request.result);
		};
		request.onerror = function findCallback() {
			Action_contact.error(requestid,requestcommand, request.result);
		};
	},
	
	clearContacts: function (requestid,requestcommand){
		var request = window.navigator.mozContacts.clear();
		request.onsuccess = function findCallback() {
			Action_contact.success(requestid,requestcommand, result);
		};
		request.onerror = function findCallback() {
			Action_contact.error(requestid,requestcommand, request.result);
		};
	},
	//single contact
	getContact: function (requestid,requestcommand,requestdata){
		var options = {
			filterBy: ['id'],
			filterOp: 'equals',
			filterValue: requestdata
		};
		var request = window.navigator.mozContacts.find(options);
		request.onsuccess = function findCallback(e) {
			var result = e.target.result[0];
			Action_contact.success(requestid,requestcommand, result);
		};
		request.onerror = function findCallback() {
			Action_contact.error(requestid,requestcommand, request.result);
		};
	},
	
	removeContact: function (requestid,requestcommand,requestdata){
		var options = {
			filterBy: ['id'],
			filterOp: 'equals',
			filterValue: requestdata
		};
		var request = window.navigator.mozContacts.find(options);
		request.onsuccess = function findCallback(e) {
			var result = e.target.result[0];
			var request2 = window.navigator.mozContacts.remove(result);
			request2.onsuccess = function findCallback(e) {
				Action_contact.success(requestid,requestcommand, requestdata);
			}
			request2.onerror = function findCallback() {
				Action_contact.error(requestid,requestcommand, result);
			};
		};
		request.onerror = function findCallback() {
			Action_contact.error(requestid,requestcommand, request.result);
		};
	},
	
	addContact: function (requestid,requestcommand,requestdata){
		var newcontact = new mozContact();
		newcontact.init(requestdata);
		var request = window.navigator.mozContacts.save(newcontact);
		request.onsuccess = function findCallback() {
			Action_contact.success(requestid,requestcommand, newcontact);
		};
		request.onerror = function findCallback() {
			Action_contact.error(requestid,requestcommand, request.result);
		};
	},
	
	updateContact: function (requestid,requestcommand,requestdata){
		var options = {
			filterBy: ['id'],
			filterOp: 'equals',
			filterValue: requestdata.id
		};
		var request = window.navigator.mozContacts.find(options);
		request.onsuccess = function findCallback(e) {
			var updatecontact = e.target.result[0];
			for (var uname in requestdata) {
				//if(uname != "photo")
				updatecontact[uname] = requestdata[uname];
			}
			var srequest = window.navigator.mozContacts.save(updatecontact);
			srequest.onsuccess = function findCallback() {
				Action_contact.success(requestid,requestcommand, updatecontact);
			};
			srequest.onerror = function findCallback() {
				Action_contact.error(requestid,requestcommand, srequest.result);
			};
		};
		request.onerror = function findCallback() {
			Action_contact.error(requestid,requestcommand, request.result);
		};
	},
	//multi contacts
	getContacts: function (requestid,requestcommand,requestdata){
		var asyncContacts = [];
		var contacts = [];
		requestdata.forEach(function(value, index) {
			asyncContacts.push(function (oncomplete) {
				var options = {
					filterBy: ['id'],
					filterOp: 'equals',
					filterValue: value
				};
				var request = window.navigator.mozContacts.find(options);
				request.onsuccess = function findCallback(e) {
					var multicontacts = {
						status: 200,
						errorMsg: null,
						data: e.target.result[0]
					};
					contacts.push(multicontacts);
					oncomplete();
				};
				request.onerror = function findCallback() {
					var multicontacts = {
						status: 202,
						errorMsg: request.result,
						data: null
					};
					contacts.push(multicontacts);
					oncomplete();
				};
			});
		});
		syncExecuteAsyncFuncs(asyncContacts, function() {
			var contactdata = {
				action: 'response',
				id: requestid,
				command: requestcommand,
				status: 200,
				data: contacts
			};
			dump(JSON.stringify(contactdata));
			Connection_internet.ws.send(JSON.stringify(contactdata));
		});
	},
	
	removeContacts: function (requestid,requestcommand, requestdata){
		var asyncContacts = [];
		var contacts = [];
		requestdata.forEach(function(value, index) {
			asyncContacts.push(function (oncomplete) {
				var options = {
					filterBy: ['id'],
					filterOp: 'equals',
					filterValue: value
				};
				var request = window.navigator.mozContacts.find(options);
				request.onsuccess = function findCallback(e) {
					var result = e.target.result[0];
					var request2 = window.navigator.mozContacts.remove(result);
					request2.onsuccess = function findCallback(e) {
						var multicontacts = {
							status: 200,
							errorMsg: null,
							data: requestdata
						};
						contacts.push(multicontacts);
						oncomplete();
					}
					request2.onerror = function findCallback() {
						var multicontacts = {
							status: 202,
							errorMsg: result,
							data: requestdata
						};
						contacts.push(multicontacts);
						oncomplete();
					};
				};
				request.onerror = function findCallback() {
					var multicontacts = {
						status: 202,
						errorMsg: request.result,
						data: requestdata
					};
					contacts.push(multicontacts);
					oncomplete();
				};
			});
		});
		syncExecuteAsyncFuncs(asyncContacts, function() {
			var contactdata = {
				action: 'response',
				id: requestid,
				command: requestcommand,
				status: 200,
				data: contacts
			};
			dump(JSON.stringify(contactdata));
			Connection_internet.ws.send(JSON.stringify(contactdata));
		});
	},
	
	addContacts: function (requestid,requestcommand, requestdata){
		var asyncContacts = [];
		var contacts = [];
		requestdata.forEach(function(value, index) {
			asyncContacts.push(function (oncomplete) {
				var newcontact = new mozContact();
				newcontact.init(value);
				var request = window.navigator.mozContacts.save(newcontact);
				request.onsuccess = function findCallback() {
					var multicontacts = {
						status: 200,
						errorMsg: null,
						data: newcontact
					};
					contacts.push(multicontacts);
					oncomplete();
				};
				request.onerror = function findCallback() {
					var multicontacts = {
						status: 202,
						errorMsg: request.result,
						data: value
					};
					contacts.push(multicontacts);
					oncomplete();
				};
			});
		});
		syncExecuteAsyncFuncs(asyncContacts, function() {
			var contactdata = {
				action: 'response',
				id: requestid,
				command: requestcommand,
				status: 200,
				data: contacts
			};
			dump(JSON.stringify(contactdata));
			Connection_internet.ws.send(JSON.stringify(contactdata));
		});
	},
		
	updateContacts: function (requestid,requestcommand, requestdata){
		var asyncContacts = [];
		var contacts = [];
		requestdata.forEach(function(value, index) {
			asyncContacts.push(function (oncomplete) {
				var options = {
					filterBy: ['id'],
					filterOp: 'equals',
					filterValue: value.id
				};
				var request = window.navigator.mozContacts.find(options);
				request.onsuccess = function findCallback(e) {
					var updatecontact = e.target.result[0];
					for (var uname in value) {
						//if(uname != "photo")
						updatecontact[uname] = value[uname];
					}
					var srequest = window.navigator.mozContacts.save(updatecontact);
					srequest.onsuccess = function findCallback() {
						var multicontacts = {
							status: 200,
							errorMsg: null,
							data: updatecontact
						};
						contacts.push(multicontacts);
						oncomplete();
					};
					srequest.onerror = function findCallback() {
						var multicontacts = {
							status: 202,
							errorMsg: request.result,
							data: value
						};
						contacts.push(multicontacts);
						oncomplete();
					};
				};
				request.onerror = function findCallback() {
					var multicontacts = {
						status: 202,
						errorMsg: request.result,
						data: value
					};
					contacts.push(multicontacts);
					oncomplete();
				};
			});
		});
		syncExecuteAsyncFuncs(asyncContacts, function() {
			var contactdata = {
				action: 'response',
				id: requestid,
				command: requestcommand,
				status: 200,
				data: contacts
			};
			dump(JSON.stringify(contactdata));
			Connection_internet.ws.send(JSON.stringify(contactdata));
		});
	}
	
};

