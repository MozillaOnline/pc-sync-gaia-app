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
    var request = window.navigator.mozSms.delete(deleteId);
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

function getAllMessages(socket,jsonCmd, sendCallback) {
  try {
    var filter = new MozSmsFilter();
    var messages = [];
    var request = window.navigator.mozSms.getMessages(filter, false);
    request.onsuccess = function(event) {
      var cursor = request.result;
      if (cursor.message) {
        var smsMessage = {
          'id': cursor.message.id,
          'delivery': cursor.message.delivery,
          'sender': cursor.message.sender,
          'receiver': cursor.message.receiver,
          'body': cursor.message.body,
          'timestamp': cursor.message.timestamp,
          'read': cursor.message.read
        };
        messages.push(smsMessage);
        cursor.
        continue ();
      } else {
        jsonCmd.result = RS_OK;
        var smsData = JSON.stringify(messages);

        jsonCmd.firstDatalength = smsData.length;
        jsonCmd.secondDatalength = 0;
          sendCallback(socket,jsonCmd, smsData,null);
      }
    };
    request.onerror = function(event) {
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
    var request = window.navigator.mozSms.getMessage(messageId);
    request.onsuccess = function(event) {
      var smsMessage = {
        'id': event.target.result.id,
        'delivery': event.target.result.delivery,
        'sender': event.target.result.sender,
        'receiver': event.target.result.receiver,
        'body': event.target.result.body,
        'timestamp': event.target.result.timestamp,
        'read': event.target.result.read
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
    window.navigator.mozSms.onreceived = function(event) {
      var smsMessage = {
        'id': event.message.id,
        'delivery': event.message.delivery,
        'sender': event.message.sender,
        'receiver': event.message.receiver,
        'body': event.message.body,
        'timestamp': event.message.timestamp,
        'read': event.message.read
      };
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(smsMessage);
      jsonCmd.firstDatalength = sendData.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, sendData,null);
    };
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
    var request = window.navigator.mozSms.markMessageRead(messageId, true);
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
    var request = window.navigator.mozSms.send(message.number, message.message);
    console.log('SmsHelper.js sendMessage request ' + request);
    request.onsuccess = function(event) {
      console.log('SmsHelper.js sendMessage onsuccess ');
      if (event.target.result) {
        var smsMessage = {
          'id': event.target.result.id,
          'delivery': event.target.result.delivery,
          'sender': event.target.result.sender,
          'receiver': event.target.result.receiver,
          'body': event.target.result.body,
          'timestamp': event.target.result.timestamp,
          'read': event.target.result.read
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
    var request = window.navigator.mozSms.send(message.number, message.message);
    jsonCmd.result = RS_OK;
    for (var i = 0; i < request.length; i++) {
      request[i].onsuccess = function(event) {
        if (event.target.result) {
          var resultData = {
            'result': RS_OK,
            'smsMessage': {
              'id': event.target.result.id,
              'delivery': event.target.result.delivery,
              'sender': event.target.result.sender,
              'receiver': event.target.result.receiver,
              'body': event.target.result.body,
              'timestamp': event.target.result.timestamp,
              'read': event.target.result.read
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