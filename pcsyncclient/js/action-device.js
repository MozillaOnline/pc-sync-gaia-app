
var Action_device = {
	sendfunc: null,
	
	init:function (data){
		this.sendfunc = data;
	},
	
	request: function (data){
		dump('pcsync action-device.js line10 :' + JSON.stringify(data));
		switch (data.command) {
			case "getdeviceinfo":{
				this.getdeviceinfo(data.id, data.command,data.data);
				break;
			}
			default:
				dump('pcsync action-device.js line17 :' + data);
				break;
		}
	},
	
	response: function (data){
		switch (data.command) {
			default:
				dump('pcsync action-device.js line25 :' + data);
				break;
		}
	},
	
	sendresponse: function (data){
		if(this.sendfunc){
			this.sendfunc.send(JSON.stringify(data));
		}
	},
	
	getdeviceinfo: function (requestid,requestcommand, requestdata){
		var asyncInfo = [];
		var info = [];
		var infotype = ['apps','music', 'pictures','videos'];
		infotype.forEach(function(value) {
			asyncInfo.push(function (oncomplete) {
				var deviceStorage = window.navigator.getDeviceStorage(value);
				if (!deviceStorage) {
					dump('pcsync action-device.js line65 :' + value);
					var infodata = {
						status: 202,
						type: value,
						data: null
					};
					info.push(infodata);
					oncomplete();
				}
				var request = deviceStorage.stat();
				request.onsuccess = function(e) {
					var infodata = {
							status: 200,
							type: value,
							data: [e.target.result.totalBytes, e.target.result.freeBytes]
						};
						info.push(infodata);
						oncomplete();
				};
				
			});
		});
		syncExecuteAsyncFuncs(asyncInfo, function() {
			var deviceinfodata = {
				action: 'response',
				id: requestid,
				command: requestcommand,
				status: 200,
				data: info
			};
			dump('pcsync action-device.js line139 :' + JSON.stringify(deviceinfodata));
			Action_device.sendresponse(deviceinfodata);
		});
	}
	
};

