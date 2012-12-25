
var Action_contact = {

	request: function (data){
		dump('xds4' + JSON.stringify(data));
		switch (data.command) {
			case "getAllContacts":{
				var options = {
					sortBy: 'familyName',
					sortOrder: 'ascending'
				};
				var request = window.navigator.mozContacts.find(options);
				request.onsuccess = function findCallback() {
					Action_contact.success(data, request.result);
				};
				request.onerror = function findCallback() {
					Action_contact.error(data, request.result);
				};
				break;
			}
			case "getContact":{
				var options = {
					filterBy: ['id'],
					filterOp: 'equals',
					filterValue: data.data
				};
				var request = window.navigator.mozContacts.find(options);
				request.onsuccess = function findCallback(e) {
					var result = e.target.result[0];
					Action_contact.success(data, result);
				};
				request.onerror = function findCallback() {
					Action_contact.error(data, request.result);
				};
				break;
			}
			case "removeContact":{
				var options = {
					filterBy: ['id'],
					filterOp: 'equals',
					filterValue: data.data
				};
				var request = window.navigator.mozContacts.find(options);
				request.onsuccess = function findCallback(e) {
					var result = e.target.result[0];
					var request2 = window.navigator.mozContacts.remove(result);
					request2.onsuccess = function findCallback(e) {
						Action_contact.success(data, data.data);
					}
					request2.onerror = function findCallback() {
						Action_contact.error(data, result);
					};
				};
				request.onerror = function findCallback() {
					Action_contact.error(data, request.result);
				};
				break;
			}
			case "clearContacts":{
				var request = window.navigator.mozContacts.clear();
				request.onsuccess = function findCallback() {
					Action_contact.success(data, result);
				};
				request.onerror = function findCallback() {
					Action_contact.error(data, request.result);
				};
				break;
			}
			case "addContact":{
				var contact = new mozContact();
				contact.init(data.data[0]);
				var request = navigator.mozContacts.save(contact);
				request.onsuccess = function findCallback() {
					Action_contact.success(data, contact);
				};
				request.onerror = function findCallback() {
					Action_contact.error(data, request.result);
				};
				break;
			}
			case "updateContact":{
				var request = navigator.mozContacts.save(data.data[0]);
				request.onsuccess = function findCallback() {
					Action_contact.success(data, data.data[0]);
				};
				request.onerror = function findCallback() {
					Action_contact.error(data, request.result);
				};
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
	
	success: function (data, result){
		var contactdata = {
			action: 'response',
			id: data.id,
			command: data.command,
			status: 200,
			data: result
		};
		dump(JSON.stringify(contactdata));
		Connection_internet.ws.send(JSON.stringify(contactdata));
		/*
		 * * alert(request.result[0].photo[0].size);
		 * */
	},
	
	error: function (data, result){
		var contactdata = {
			action: 'response',
			id: data.id,
			command: data.command,
			status: 201,
			data: result
		};
		dump(JSON.stringify(contactdata));
		Connection_internet.ws.send(JSON.stringify(contactdata));
	}
	
};

