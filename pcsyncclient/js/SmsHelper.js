/*------------------------------------------------------------------------------------------------------------
 *File Name: SmsHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage Sms
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function smsHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "deleteMessageById":
      {
        deleteMessageById(jsonCmd, sendCallback);
        break;
      }
    case "getAllMessages":
      {
        getAllMessages(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getMessageById":
      {
        getMessageById(jsonCmd, sendCallback);
        break;
      }
    case "listenMessage":
      {
        listenMessage(jsonCmd, sendCallback);
        break;
      }
    case "markReadMessageById":
      {
        markReadMessageById(jsonCmd, sendCallback);
        break;
      }
    case "sendMessage":
      {
        sendMessage(jsonCmd, sendCallback);
        break;
      }
    case "sendMessages":
      {
        sendMessages(jsonCmd, sendCallback, sendList);
        break;
      }
    default:
      {
        console.log('SmsHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    console.log('SmsHelper.js smsHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function deleteMessageById(jsonCmd, sendCallback) {
  try {
    var request = window.navigator.mozSms.delete(jsonCmd.data);
    request.onsuccess = function(event) {
      if (event.target.result) {
        jsonCmd.result = RS_OK;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      } else {
        jsonCmd.result = RS_ERROR.SMS_MESSAGE_NOTFOUND;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      }
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_DELETEMESSAGE;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('SmsHelper.js deleteMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllMessages(jsonCmd, sendCallback, sendList) {
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
        if (smsData.length <= MAX_PACKAGE_SIZE) {
          jsonCmd.data = smsData;
          jsonCmd.exdatalength = 0;
          sendCallback(jsonCmd);
        } else {
          jsonCmd.data = smsData.substr(0, MAX_PACKAGE_SIZE);
          jsonCmd.exdatalength = smsData.length - MAX_PACKAGE_SIZE;
          for (var i = MAX_PACKAGE_SIZE; i < smsData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < smsData.length) {
              sendList.push(smsData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(smsData.substr(i));
            }
          }
          sendCallback(jsonCmd);
        }
      }
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('SmsHelper.js getAllMessages failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getMessageById(jsonCmd, sendCallback) {
  try {
    var request = window.navigator.mozSms.getMessage(jsonCmd.data);
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
      jsonCmd.data = JSON.stringify(smsMessage);
      jsonCmd.exdatalength = 0;
      sendCallback(jsonCmd);
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETMESSAGE;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('SmsHelper.js getMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function listenMessage(jsonCmd, sendCallback) {
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
      jsonCmd.exdatalength = 0;
      jsonCmd.data = JSON.stringify(smsMessage);
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('SmsHelper.js listenMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function markReadMessageById(jsonCmd, sendCallback) {
  try {
    var request = window.navigator.mozSms.markMessageRead(jsonCmd.data, true);
    request.onsuccess = function(event) {
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_MARDREAD;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('SmsHelper.js markReadMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function sendMessage(jsonCmd, sendCallback) {
  try {
    var message = JSON.parse(jsonCmd.data);
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
        jsonCmd.data = JSON.stringify(smsMessage);
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.result = RS_ERROR.SMS_SENDMESSAGE;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      }
    };
    request.onerror = function(event) {
      console.log('SmsHelper.js sendMessage onerror ');
      jsonCmd.result = RS_ERROR.SMS_SENDMESSAGE;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('SmsHelper.js sendMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function sendMessages(jsonCmd, sendCallback, sendList) {
  try {
    var messageList = [];
    var message = JSON.parse(jsonCmd.data);
    if (message.number.length == 0) {
      jsonCmd.result = SMS_EMPTYNUMBER;
      jsonCmd.data = "";
      jsonCmd.exdatalength = 0;
      sendCallback(jsonCmd);
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
            if (messagesData.length <= MAX_PACKAGE_SIZE) {
              jsonCmd.data = messagesData;
              jsonCmd.exdatalength = 0;
              sendCallback(jsonCmd);
            } else {
              jsonCmd.data = messagesData.substr(0, MAX_PACKAGE_SIZE);
              jsonCmd.exdatalength = messagesData.length - MAX_PACKAGE_SIZE;
              for (var i = MAX_PACKAGE_SIZE; i < messagesData.length; i += MAX_PACKAGE_SIZE) {
                if (i + MAX_PACKAGE_SIZE < messagesData.length) {
                  sendList.push(messagesData.substr(i, MAX_PACKAGE_SIZE));
                } else {
                  sendList.push(messagesData.substr(i));
                }
              }
              sendCallback(jsonCmd);
            }
          }
        } else {
          var resultData = {
            'result': RS_ERROR.SMS_SENDMESSAGE,
            'smsMessage': null
          };
          messageList.push(resultData);
          if (messageList.length == request.length) {
            var messagesData = JSON.stringify(messageList);
            if (messagesData.length <= MAX_PACKAGE_SIZE) {
              jsonCmd.data = messagesData;
              jsonCmd.exdatalength = 0;
              sendCallback(jsonCmd);
            } else {
              jsonCmd.data = messagesData.substr(0, MAX_PACKAGE_SIZE);
              jsonCmd.exdatalength = messagesData.length - MAX_PACKAGE_SIZE;
              for (var i = MAX_PACKAGE_SIZE; i < messagesData.length; i += MAX_PACKAGE_SIZE) {
                if (i + MAX_PACKAGE_SIZE < messagesData.length) {
                  sendList.push(messagesData.substr(i, MAX_PACKAGE_SIZE));
                } else {
                  sendList.push(messagesData.substr(i));
                }
              }
              sendCallback(jsonCmd);
            }
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
          console.log('SmsHelper.js messagesData failed: ' + messagesData);
          if (messagesData.length <= MAX_PACKAGE_SIZE) {
            jsonCmd.data = messagesData;
            jsonCmd.exdatalength = 0;
            sendCallback(jsonCmd);
          } else {
            jsonCmd.data = messagesData.substr(0, MAX_PACKAGE_SIZE);
            jsonCmd.exdatalength = messagesData.length - MAX_PACKAGE_SIZE;
            for (var i = MAX_PACKAGE_SIZE; i < messagesData.length; i += MAX_PACKAGE_SIZE) {
              if (i + MAX_PACKAGE_SIZE < messagesData.length) {
                sendList.push(messagesData.substr(i, MAX_PACKAGE_SIZE));
              } else {
                sendList.push(messagesData.substr(i));
              }
            }
            sendCallback(jsonCmd);
          }
        }
      };
    }
  } catch (e) {
    console.log('SmsHelper.js sendMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}