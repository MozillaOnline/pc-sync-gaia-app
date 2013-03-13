
var Action_sms = {
  sendfunc: null,
  receiveid: 0,
  
  init:function (data){
    this.sendfunc = data;
    window.navigator.mozSms.onreceived = function onreceived(event) {
      var incomingSms = event.message;
      var SmsMessage = {
        id: incomingSms.id,
        delivery: incomingSms.delivery,
        sender: incomingSms.sender,
        receiver: incomingSms.receiver,
        body: incomingSms.body,
        timestamp: incomingSms.timestamp,
        read: incomingSms.read
      };
      var smsdata = {
        action: 'request',
        id: reciveid++,
        command: 'recievesms',
        status: 200,
        data: SmsMessage
      };
      Action_sms.sendresponse(smsdata);
    };
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
    dump('pcsync action-sms.js line75 :' + requestdata.id + ':' + requestdata.message);
    /*window.navigator.mozSms.onsent = function(event) {
      dump('pcsync action-sms.js line88 :' + event.message.id + ':' + event.message.body);
    };*/
    var request = window.navigator.mozSms.send(requestdata.id, requestdata.message);
    request.onsuccess = function sendCallback(event) {
      if(event.target.result){
        var SmsMessage = {
          id: event.target.result.id,
          delivery: event.target.result.delivery,
          sender: event.target.result.sender,
          receiver: event.target.result.receiver,
          body: event.target.result.body,
          timestamp: event.target.result.timestamp,
          read: event.target.result.read
        };
        Action_sms.success(requestid,requestcommand,event.target.result);
      } else {
        Action_sms.error(requestid,requestcommand, event.target.error);
      }
    };
    request.onerror = function sendCallback(event) {
      Action_sms.error(requestid,requestcommand, event.target.error.name);
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
    request.onsuccess = function getMessageCallback(event) {
      var foundSms = event.target.result;
      var SmsMessage = {
          id: foundSms.id,
          delivery: foundSms.delivery,
          sender: foundSms.sender,
          receiver: foundSms.receiver,
          body: foundSms.body,
          timestamp: foundSms.timestamp,
          read: foundSms.read
      };
      Action_sms.success(requestid,requestcommand,SmsMessage);
    };
    request.onerror = function getMessageCallback(event) {
      Action_sms.error(requestid,requestcommand, event.target.error.name);
    };
  },
  
  getMessages: function (requestid,requestcommand, requestdata){
    var filter = new MozSmsFilter();
    var messages = [];
    var request = window.navigator.mozSms.getMessages(filter, false);
    request.onsuccess = function(event) {
      var cursor = request.result;
      if (cursor.message) {
        var SmsMessage = {
          id: cursor.message.id,
          delivery: cursor.message.delivery,
          sender: cursor.message.sender,
          receiver: cursor.message.receiver,
          body: cursor.message.body,
          timestamp: cursor.message.timestamp,
          read: cursor.message.read
        };
        dump('pcsync action-sms.js line91:' + JSON.stringify(SmsMessage));
        messages.push(SmsMessage);
        cursor.continue();
      } else {
        Action_sms.success(requestid,requestcommand,messages);
      }
    };

    request.onerror = function(event) {
      dump('pcsync action-sms.js line111:' + request.errorCode);
      Action_sms.error(requestid,requestcommand, event.target.error.name);
    };
  },
  
  markMessageRead: function (requestid,requestcommand, requestdata){
    var request = window.navigator.mozSms.markMessageRead(requestdata.id,requestdata.readbool);
    request.onsuccess = function getMessageCallback(event) {
      Action_sms.success(requestid,requestcommand,event.target.result);
    };
    request.onerror = function getMessageCallback(event) {
      Action_sms.error(requestid,requestcommand, event.target.error.name);
    };
  }
};

