/*------------------------------------------------------------------------------------------------------------
 *File Name: SmsHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage Sms
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function smsHelper(socket, jsonCmd, sendCallback,  recvList) {
  try {
    switch (jsonCmd.command) {
    case SMS_COMMAND.deleteMessageById:
      {
        deleteMessageById(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.getAllMessages:
      {
        getAllMessages(socket,jsonCmd, sendCallback);
        break;
      }
    case SMS_COMMAND.getMessageById:
      {
        getMessageById(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.getThreadMessagesById:
      {
        getThreadMessagesById(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.getThreads:
      {
        getThreads(socket,jsonCmd, sendCallback);
        break;
      }      
    case SMS_COMMAND.listenMessage:
      {
        listenMessage(socket,jsonCmd, sendCallback);
        break;
      }
    case SMS_COMMAND.markReadMessageById:
      {
        markReadMessageById(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.sendMessage:
      {
        sendMessage(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.sendMessages:
      {
        sendMessages(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('SmsHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
        break;
      }
    }
  } catch (e) {
    console.log('SmsHelper.js smsHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function deleteMessageById(socket,jsonCmd, sendCallback, recvList) {
  try {
    var smsId = recvList.shift();
    var deleteId = parseInt(smsId);
    console.log('SmsHelper.js smsHelper deleteMessageById: ' + deleteId );
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    var request = _mozMobileMessage.delete(deleteId);
    request.onsuccess = function(event) {
      if (event.target.result) {
        jsonCmd.result = RS_OK;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null, null);
      } else {
        jsonCmd.result = RS_ERROR.SMS_MESSAGE_NOTFOUND;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
      }
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_DELETEMESSAGE;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
  } catch (e) {
    console.log('SmsHelper.js deleteMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function getThreads(socket,jsonCmd, sendCallback) {
  try {
    var filter = new MozSmsFilter();
    var messages = [];
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    var cursor = _mozMobileMessage.getThreads();
    cursor.onsuccess = function(event) {	
      if (!this.done) {
      var smsMessage = {
        'id': this.result.id,
        'body': this.result.body,
	'timestamp': this.result.timestamp.getTime(),
        'unreadCount': this.result.unreadCount,
	'participants': this.result.participants,
	'lastMessageType': this.result.lastMessageType
      };
        messages.push(smsMessage);
	console.log('SmsHelper.js deleteMessageById event: ' + JSON.stringify(smsMessage));
        this.
        continue ();
      } else {
        jsonCmd.result = RS_OK;
        var smsData = JSON.stringify(messages);
        jsonCmd.firstDatalength = smsData.length;
        jsonCmd.secondDatalength = 0;
          sendCallback(socket,jsonCmd, smsData,null);
      }
    };
    cursor.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
  } catch (e) {
    console.log('SmsHelper.js getAllMessages failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function getThreadMessagesById(socket,jsonCmd, sendCallback, recvList) {
  try {
    var smsId = recvList.shift();
    var messageId = parseInt(smsId);
    var filter = new MozSmsFilter();
    var messages = [];
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    filter.threadId = messageId;
    //console.log('SmsHelper.js deleteMessageById filter.threadId: ' + filter.threadId);
    var cursor = _mozMobileMessage.getMessages(filter, false);
    cursor.onsuccess = function(event) {
//      for(var uname in this.result)
//	console.log('SmsHelper.js deleteMessageById event: ' + uname);
      if (!this.done) {
	var smsMessage = {
	'type': this.result.type,
	'id': this.result.id,
        'threadId': this.result.threadId,
        'delivery': this.result.delivery,
	'deliveryStatus': this.result.deliveryStatus,
        'sender': this.result.sender,
        'receiver': this.result.receiver,
        'body': this.result.body,
	'messageClass': this.result.messageClass,
	'timestamp': this.result.timestamp.getTime(),
        'read': this.result.read
      };
        messages.push(smsMessage);
	console.log('SmsHelper.js deleteMessageById event: ' + JSON.stringify(smsMessage));
        this.
        continue ();
      } else {
        jsonCmd.result = RS_OK;
        var smsData = JSON.stringify(messages);
        jsonCmd.firstDatalength = smsData.length;
        jsonCmd.secondDatalength = 0;
          sendCallback(socket,jsonCmd, smsData,null);
      }
    };
    cursor.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
  } catch (e) {
    console.log('SmsHelper.js getAllMessages failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function getAllMessages(socket,jsonCmd, sendCallback) {
  try {
    var filter = new MozSmsFilter();
    var messages = [];
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    var cursor = _mozMobileMessage.getMessages(filter, false);
    cursor.onsuccess = function(event) {
//      for(var uname in this.result)
//	console.log('SmsHelper.js deleteMessageById event: ' + uname);
      if (!this.done) {
	var smsMessage = {
	'type': this.result.type,
	'id': this.result.id,
        'threadId': this.result.threadId,
        'delivery': this.result.delivery,
	'deliveryStatus': this.result.deliveryStatus,
        'sender': this.result.sender,
        'receiver': this.result.receiver,
        'body': this.result.body,
	'messageClass': this.result.messageClass,
	'timestamp': this.result.timestamp.getTime(),
        'read': this.result.read
      };
        messages.push(smsMessage);
	console.log('SmsHelper.js deleteMessageById event: ' + JSON.stringify(smsMessage));
        this.
        continue ();
      } else {
        jsonCmd.result = RS_OK;
        var smsData = JSON.stringify(messages);
        jsonCmd.firstDatalength = smsData.length;
        jsonCmd.secondDatalength = 0;
          sendCallback(socket,jsonCmd, smsData,null);
      }
    };
    cursor.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
  } catch (e) {
    console.log('SmsHelper.js getAllMessages failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function getMessageById(socket,jsonCmd, sendCallback, recvList) {
  try {
    var smsId = recvList.shift();
    var messageId = parseInt(smsId);
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    var request = _mozMobileMessage.getMessage(messageId);
    request.onsuccess = function(event) {
      var smsMessage = {
        'type': this.result.type,
	'id': this.result.id,
        'threadId': this.result.threadId,
        'delivery': this.result.delivery,
	'deliveryStatus': this.result.deliveryStatus,
        'sender': this.result.sender,
        'receiver': this.result.receiver,
        'body': this.result.body,
	'messageClass': this.result.messageClass,
	'timestamp': this.result.timestamp.getTime(),
        'read': this.result.read
      };
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(smsMessage);
      jsonCmd.firstDatalength = sendData.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, sendData,null);
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETMESSAGE;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
  } catch (e) {
    console.log('SmsHelper.js getMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function listenMessage(socket,jsonCmd, sendCallback) {
  try {
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    _mozMobileMessage.addEventListener('received', function onMessageReceived(e){
      var message = e.message;
      console.log('SmsHelper.js listenMessage message: ' + message);
      if (message.messageClass === 'class-0') {
        return;
      }
      var smsMessage = {
        'type': message.type,
	'id': message.id,
        'threadId': message.threadId,
        'delivery': message.delivery,
	'deliveryStatus': message.deliveryStatus,
        'sender': message.sender,
        'receiver': message.receiver,
        'body': message.body,
	'messageClass': message.messageClass,
	'timestamp': message.timestamp.getTime(),
        'read': message.read
      };
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(smsMessage);
      jsonCmd.firstDatalength = sendData.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, sendData,null);
    });
    _mozMobileMessage.addEventListener('sent', function onMessageReceived(e){
      var message = e.message;
      console.log('SmsHelper.js listenMessage message: ' + message);
      if (message.messageClass === 'class-0') {
        return;
      }
      var smsMessage = {
        'type': message.type,
	'id': message.id,
        'threadId': message.threadId,
        'delivery': message.delivery,
	'deliveryStatus': message.deliveryStatus,
        'sender': message.sender,
        'receiver': message.receiver,
        'body': message.body,
	'messageClass': message.messageClass,
	'timestamp': message.timestamp.getTime(),
        'read': message.read
      };
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(smsMessage);
      jsonCmd.firstDatalength = sendData.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, sendData,null);
    });
/*    this._mozMobileMessage.addEventListener('sending', this.onMessageSending);
    this._mozMobileMessage.addEventListener('sent', this.onMessageSent);
    this._mozMobileMessage.addEventListener('failed', this.onMessageFailed);
    window.addEventListener('hashchange', this.onHashChange.bind(this));
    document.addEventListener('mozvisibilitychange',
                              this.onVisibilityChange.bind(this));*/
  } catch (e) {
    console.log('SmsHelper.js listenMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function markReadMessageById(socket,jsonCmd, sendCallback, recvList) {
  try {
    var smsId = recvList.shift();
    var messageId = parseInt(smsId);
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    var request = _mozMobileMessage.markMessageRead(messageId, true);
    request.onsuccess = function(event) {
      jsonCmd.result = RS_OK;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_MARDREAD;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
  } catch (e) {
    console.log('SmsHelper.js markReadMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function sendMessage(socket,jsonCmd, sendCallback, recvList) {
  try {
    var smsId = recvList.shift();
    var message = JSON.parse(smsId);
    console.log('SmsHelper.js sendMessage message ' + message);
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    var request = _mozMobileMessage.send(message.number, message.message);
    console.log('SmsHelper.js sendMessage request ' + request);
    request.onsuccess = function(event) {
      console.log('SmsHelper.js sendMessage onsuccess ');
      if (event.target.result) {
        var smsMessage = {
          'type': this.result.type,
	  'id': this.result.id,
	  'threadId': this.result.threadId,
	  'delivery': this.result.delivery,
	  'deliveryStatus': this.result.deliveryStatus,
	  'sender': this.result.sender,
	  'receiver': this.result.receiver,
	  'body': this.result.body,
	  'messageClass': this.result.messageClass,
	  'timestamp': this.result.timestamp.getTime(),
	  'read': this.result.read
        };
        jsonCmd.result = RS_OK;
        var sendData = JSON.stringify(smsMessage);
        jsonCmd.firstDatalength = sendData.length;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, sendData,null);
      } else {
        jsonCmd.result = RS_ERROR.SMS_SENDMESSAGE;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
      }
    };
    request.onerror = function(event) {
      console.log('SmsHelper.js sendMessage onerror ');
      jsonCmd.result = RS_ERROR.SMS_SENDMESSAGE;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    };
  } catch (e) {
    console.log('SmsHelper.js sendMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function sendMessages(socket,jsonCmd, sendCallback, recvList) {
  try {
    var messageList = [];
    var smsId = recvList.shift();
    var message = JSON.parse(smsId);
    if (message.number.length == 0) {
      jsonCmd.result = SMS_EMPTYNUMBER;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    }
    var _mozMobileMessage = navigator.mozMobileMessage ||
                    window.DesktopMockNavigatormozMobileMessage;
    var request = _mozMobileMessage.send(message.number, message.message);
    jsonCmd.result = RS_OK;
    for (var i = 0; i < request.length; i++) {
      request[i].onsuccess = function(event) {
        if (event.target.result) {
          var resultData = {
            'result': RS_OK,
            'smsMessage': {
              'type': this.result.type,
	      'id': this.result.id,
	      'threadId': this.result.threadId,
	      'delivery': this.result.delivery,
	      'deliveryStatus': this.result.deliveryStatus,
	      'sender': this.result.sender,
	      'receiver': this.result.receiver,
	      'body': this.result.body,
	      'messageClass': this.result.messageClass,
	      'time': this.result.timestamp.getTime(),
	      'read': this.result.read
            }
          };
          messageList.push(resultData);
          if (messageList.length == request.length) {
            var messagesData = JSON.stringify(messageList);
            jsonCmd.firstDatalength = messagesData.length;
            jsonCmd.secondDatalength = 0;
              sendCallback(socket,jsonCmd, messagesData,null);
          }
        } else {
          var resultData = {
            'result': RS_ERROR.SMS_SENDMESSAGE,
            'smsMessage': null
          };
          messageList.push(resultData);
          if (messageList.length == request.length) {
            var messagesData = JSON.stringify(messageList);
            jsonCmd.firstDatalength = messagesData.length;
            jsonCmd.secondDatalength = 0;
              sendCallback(socket,jsonCmd, messagesData,null);
          }
        }
      };
      request[i].onerror = function(event) {
        var resultData = {
          'result': RS_ERROR.SMS_SENDMESSAGE,
          'smsMessage': null
        };
        console.log('SmsHelper.js messagesData failed: ' + JSON.stringify(resultData));
        messageList.push(resultData);
        if (messageList.length == request.length) {
          var messagesData = JSON.stringify(messageList);

          jsonCmd.firstDatalength = messagesData.length;
          jsonCmd.secondDatalength = 0;
            sendCallback(socket,jsonCmd, messagesData,null);
          console.log('SmsHelper.js messagesData failed: ' + messagesData);
        }
      };
    }
  } catch (e) {
    console.log('SmsHelper.js sendMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}
