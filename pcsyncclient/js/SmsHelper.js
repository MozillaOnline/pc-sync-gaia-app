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
    case SMS_COMMAND.deleteMessageById:
      {
        deleteMessageById(jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.getAllMessages:
      {
        getAllMessages(jsonCmd, sendCallback, sendList);
        break;
      }
    case SMS_COMMAND.getMessageById:
      {
        getMessageById(jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.listenMessage:
      {
        listenMessage(jsonCmd, sendCallback);
        break;
      }
    case SMS_COMMAND.markReadMessageById:
      {
        markReadMessageById(jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.sendMessage:
      {
        sendMessage(jsonCmd, sendCallback, recvList);
        break;
      }
    case SMS_COMMAND.sendMessages:
      {
        sendMessages(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    default:
      {
        console.log('SmsHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('SmsHelper.js smsHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function deleteMessageById(jsonCmd, sendCallback, recvList) {
  try {
    var request = window.navigator.mozSms.delete(recvList[0]);
    request.onsuccess = function(event) {
      if (event.target.result) {
        jsonCmd.result = RS_OK;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      } else {
        jsonCmd.result = RS_ERROR.SMS_MESSAGE_NOTFOUND;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      }
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_DELETEMESSAGE;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('SmsHelper.js deleteMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
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

        jsonCmd.smallDatalength = smsData.length;
        jsonCmd.largeDatalength = 0;
        if (smsData.length <= MAX_PACKAGE_SIZE) {
          sendCallback(jsonCmd, smsData);
        } else {
          sendCallback(jsonCmd, smsData.substr(0, MAX_PACKAGE_SIZE));
          for (var i = MAX_PACKAGE_SIZE; i < smsData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < smsData.length) {
              sendList.push(smsData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(smsData.substr(i));
            }
          }
        }
      }
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('SmsHelper.js getAllMessages failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getMessageById(jsonCmd, sendCallback, recvList) {
  try {
    var request = window.navigator.mozSms.getMessage(recvList[0]);
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
      jsonCmd.smallDatalength = sendData.length;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, sendData);
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_GETMESSAGE;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('SmsHelper.js getMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
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
      var sendData = JSON.stringify(smsMessage);
      jsonCmd.smallDatalength = sendData.length;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, sendData);
    };
  } catch (e) {
    console.log('SmsHelper.js listenMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function markReadMessageById(jsonCmd, sendCallback, recvList) {
  try {
    var request = window.navigator.mozSms.markMessageRead(recvList[0], true);
    request.onsuccess = function(event) {
      jsonCmd.result = RS_OK;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
    request.onerror = function(event) {
      jsonCmd.result = RS_ERROR.SMS_MARDREAD;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('SmsHelper.js markReadMessageById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function sendMessage(jsonCmd, sendCallback, recvList) {
  try {
    var message = JSON.parse(recvList[0]);
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
        jsonCmd.smallDatalength = sendData.length;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, sendData);
      } else {
        jsonCmd.result = RS_ERROR.SMS_SENDMESSAGE;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      }
    };
    request.onerror = function(event) {
      console.log('SmsHelper.js sendMessage onerror ');
      jsonCmd.result = RS_ERROR.SMS_SENDMESSAGE;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('SmsHelper.js sendMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function sendMessages(jsonCmd, sendCallback, sendList, recvList) {
  try {
    var messageList = [];
    var message = JSON.parse(recvList[0]);
    if (message.number.length == 0) {
      jsonCmd.result = SMS_EMPTYNUMBER;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
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
            jsonCmd.smallDatalength = messagesData.length;
            jsonCmd.largeDatalength = 0;
            if (messagesData.length <= MAX_PACKAGE_SIZE) {
              sendCallback(jsonCmd, messagesData);
            } else {
              sendCallback(jsonCmd, messagesData.substr(0, MAX_PACKAGE_SIZE));
              for (var i = MAX_PACKAGE_SIZE; i < messagesData.length; i += MAX_PACKAGE_SIZE) {
                if (i + MAX_PACKAGE_SIZE < messagesData.length) {
                  sendList.push(messagesData.substr(i, MAX_PACKAGE_SIZE));
                } else {
                  sendList.push(messagesData.substr(i));
                }
              }
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
            jsonCmd.smallDatalength = messagesData.length;
            jsonCmd.largeDatalength = 0;
            if (messagesData.length <= MAX_PACKAGE_SIZE) {
              sendCallback(jsonCmd, messagesData);
            } else {
              sendCallback(jsonCmd, messagesData.substr(0, MAX_PACKAGE_SIZE));
              for (var i = MAX_PACKAGE_SIZE; i < messagesData.length; i += MAX_PACKAGE_SIZE) {
                if (i + MAX_PACKAGE_SIZE < messagesData.length) {
                  sendList.push(messagesData.substr(i, MAX_PACKAGE_SIZE));
                } else {
                  sendList.push(messagesData.substr(i));
                }
              }
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

          jsonCmd.smallDatalength = messagesData.length;
          jsonCmd.largeDatalength = 0;
          if (messagesData.length <= MAX_PACKAGE_SIZE) {
            sendCallback(jsonCmd, messagesData);
          } else {
            sendCallback(jsonCmd, messagesData.substr(0, MAX_PACKAGE_SIZE));
            for (var i = MAX_PACKAGE_SIZE; i < messagesData.length; i += MAX_PACKAGE_SIZE) {
              if (i + MAX_PACKAGE_SIZE < messagesData.length) {
                sendList.push(messagesData.substr(i, MAX_PACKAGE_SIZE));
              } else {
                sendList.push(messagesData.substr(i));
              }
            }
          }
          console.log('SmsHelper.js messagesData failed: ' + messagesData);
        }
      };
    }
  } catch (e) {
    console.log('SmsHelper.js sendMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}