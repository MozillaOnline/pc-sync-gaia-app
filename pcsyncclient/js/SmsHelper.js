/*------------------------------------------------------------------------------------------------------------
 *File Name: SmsHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage Sms
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function smsHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    switch (jsonCmd.command) {
    case SMS_COMMAND.deleteMessageById:
      {
        deleteMessageById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case SMS_COMMAND.getAllMessages:
      {
        getAllMessages(socket, jsonCmd, sendCallback);
        break;
      }
    case SMS_COMMAND.getSMSById:
      {
        getSMSById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case SMS_COMMAND.getMMSById:
      {
        getMMSById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case SMS_COMMAND.getThreadMessagesById:
      {
        getThreadMessagesById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case SMS_COMMAND.getThreads:
      {
        getThreads(socket, jsonCmd, sendCallback);
        break;
      }
    case SMS_COMMAND.markReadMessageById:
      {
        markReadMessageById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case SMS_COMMAND.sendSMS:
      {
        sendSMS(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case SMS_COMMAND.sendMMS:
      {
        sendMMS(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case SMS_COMMAND.resendMessage:
      {
        resendMessage(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    default:
      {
        debug('SmsHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('SmsHelper.js smsHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}
// mozMobileMessage.delete() has been modified per bug 771458.
// Now deleteMessage() can take an id or an array of id.

function deleteMessageById(socket, jsonCmd, sendCallback, recvData) {
  //var smsId = recvData;
  var deleteId;
  var smsId = JSON.parse(recvData);
  if (!Array.isArray(smsId.id)) {
    deleteId = parseInt(smsId.id);
  } else {
    deleteId = smsId.id.concat();
  }
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  var request = _mozMobileMessage.delete(deleteId);
  request.onsuccess = function(event) {
    jsonCmd.result = RS_OK;
    sendCallback(socket, jsonCmd, null);
  };
  request.onerror = function(event) {
    jsonCmd.result = RS_ERROR.SMS_DELETEMESSAGE;
    sendCallback(socket, jsonCmd, null);
  };
}

function getThreads(socket, jsonCmd, sendCallback) {
  var filter = new MozSmsFilter();
  var messages = [];
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  var cursor = _mozMobileMessage.getThreads();
  cursor.onsuccess = function(event) {
    //for(var uname in this.result)
    //  debug('SmsHelper.js deleteMessageById event: ' + uname + ' value: ' + this.result[uname]);
    if (!this.done) {
      var smsMessage = {
        'id': this.result.id,
        'body': this.result.body,
        'timestamp': this.result.timestamp,
        'unreadCount': this.result.unreadCount,
        'participants': this.result.participants,
        'lastMessageType': this.result.lastMessageType
      };
      messages.push(smsMessage);
      debug('SmsHelper.js deleteMessageById event: ' + JSON.stringify(smsMessage));
      this.continue ();
    } else {
      jsonCmd.result = RS_OK;
      var smsData = JSON.stringify(messages);
      sendCallback(socket, jsonCmd, smsData);
    }
  };
  cursor.onerror = function(event) {
    jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
    sendCallback(socket, jsonCmd, null);
  };
}

function getThreadMessagesById(socket, jsonCmd, sendCallback, recvData) {
  var smsId = recvData;
  var messageId = parseInt(smsId);
  var filter = new MozSmsFilter();
  var messages = [];
  var count = 0;
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  filter.threadId = messageId;
  var cursor = _mozMobileMessage.getMessages(filter, false);
  cursor.onsuccess = function(event) {
    if (this.done) {
      if (messages.length == count) {
        jsonCmd.result = RS_OK;
        var smsData = JSON.stringify(messages);
        sendCallback(socket, jsonCmd, smsData);
      } else {
        count = 0;
      }
      return;
    }
    count++;
    var result = this.result;
    if (result.type == 'sms') {
      var smsMessage = {
        'type': result.type,
        'id': result.id,
        'threadId': result.threadId,
        'delivery': result.delivery,
        'deliveryStatus': result.deliveryStatus,
        'sender': result.sender,
        'receiver': result.receiver,
        'body': result.body,
        'messageClass': result.messageClass,
        'timestamp': result.timestamp,
        'read': result.read
      };
      messages.push(smsMessage);
    } else if (result.type == 'mms') {
      var mmsMessage = {
        'type': result.type,
        'id': result.id,
        'threadId': result.threadId,
        'delivery': result.delivery,
        'deliveryStatus': result.deliveryStatus,
        'sender': result.sender,
        'timestamp': result.timestamp,
        'read': result.read,
        'receivers': result.receivers,
        'subject': result.subject,
        'smil': result.smil,
        'expiryDate': result.expiryDate,
        'attachments': []
      };
      for (var i = 0; i < result.attachments.length; i++) {
        let attachment = {
          'id': result.attachments[i].id,
          'location': result.attachments[i].location,
          'content': null
        };
        let fileReader = new FileReader();
        fileReader.readAsDataURL(result.attachments[i].content);
        fileReader.onload = function(e) {
          attachment.content = e.target.result;
          debug('SmsHelper.js attachment: ' + i + '!!!' + JSON.stringify(attachment));
          mmsMessage.attachments.push(attachment);
          if (mmsMessage.attachments.length == result.attachments.length) {
            messages.push(mmsMessage);
            if (count == 0) {
              jsonCmd.result = RS_OK;
              let smsData = JSON.stringify(messages);
              sendCallback(socket, jsonCmd, smsData);
            }
          }
        }
      }
    }
    this.continue();
  };
  cursor.onerror = function(event) {
    jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
    sendCallback(socket, jsonCmd, null);
  };
}

function getAllMessages(socket, jsonCmd, sendCallback) {
  var filter = new MozSmsFilter();
  var messages = [];
  var count = 0;
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  var cursor = _mozMobileMessage.getMessages(filter, false);
  cursor.onsuccess = function(event) {
    //      for(var uname in this.result)
    //    debug('SmsHelper.js deleteMessageById event: ' + uname);
    if (this.done) {
      if (messages.length == count) {
        jsonCmd.result = RS_OK;
        var smsData = JSON.stringify(messages);
        sendCallback(socket, jsonCmd, smsData);
      } else {
        count = 0;
      }
      return;
    }
    count++;
    var result = this.result;
    if (result.type == 'sms') {
      var smsMessage = {
        'type': result.type,
        'id': result.id,
        'threadId': result.threadId,
        'delivery': result.delivery,
        'deliveryStatus': result.deliveryStatus,
        'sender': result.sender,
        'receiver': result.receiver,
        'body': result.body,
        'messageClass': result.messageClass,
        'timestamp': result.timestamp,
        'read': result.read
      };
      messages.push(smsMessage);
    } else if (result.type == 'mms') {
      var mmsMessage = {
        'type': result.type,
        'id': result.id,
        'threadId': result.threadId,
        'delivery': result.delivery,
        'deliveryStatus': result.deliveryStatus,
        'sender': result.sender,
        'timestamp': result.timestamp,
        'read': result.read,
        'receivers': result.receivers,
        'subject': result.subject,
        'smil': result.smil,
        'expiryDate': result.expiryDate,
        'attachments': []
      };
      for (var i = 0; i < result.attachments.length; i++) {
        let attachment = {
          'id': result.attachments[i].id,
          'location': result.attachments[i].location,
          'content': null
        };
        let fileReader = new FileReader();
        fileReader.readAsDataURL(result.attachments[i].content);
        fileReader.onload = function(e) {
          attachment.content = e.target.result;
          mmsMessage.attachments.push(attachment);
          if (mmsMessage.attachments.length == result.attachments.length) {
            messages.push(mmsMessage);
            if (count == 0) {
              jsonCmd.result = RS_OK;
              let smsData = JSON.stringify(messages);
              sendCallback(socket, jsonCmd, smsData);
            }
          }
        }
      }
    }
    this.continue ();
  };
  cursor.onerror = function(event) {
    jsonCmd.result = RS_ERROR.SMS_GETALLMESSAGES;
    sendCallback(socket, jsonCmd, null);
  };
}

function getSMSById(socket, jsonCmd, sendCallback, recvData) {
  var smsId = recvData;
  var messageId = parseInt(smsId);
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  var request = _mozMobileMessage.getMessage(messageId);
  request.onsuccess = function(event) {
    if (this.result.type != 'sms') {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
      return;
    }
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
      'timestamp': this.result.timestamp,
      'read': this.result.read
    };
    jsonCmd.result = RS_OK;
    var sendData = JSON.stringify(smsMessage);
    sendCallback(socket, jsonCmd, sendData);
  };
  request.onerror = function(event) {
    jsonCmd.result = RS_ERROR.SMS_GETMESSAGE;
    sendCallback(socket, jsonCmd, null);
  };
}

function getMMSById(socket, jsonCmd, sendCallback, recvData) {
  var smsId = recvData;
  var messageId = parseInt(smsId);
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  var request = _mozMobileMessage.retrieveMMS(messageId);
  request.onsuccess = function(event) {
    if (this.result.type != 'mms') {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
      return;
    }
    var mmsMessage = {
      'type': result.type,
      'id': result.id,
      'threadId': result.threadId,
      'delivery': result.delivery,
      'deliveryStatus': result.deliveryStatus,
      'sender': result.sender,
      'timestamp': result.timestamp,
      'read': result.read,
      'receivers': result.receivers,
      'subject': result.subject,
      'smil': result.smil,
      'expiryDate': result.expiryDate,
      'attachments': []
    };
    for (var i = 0; i < result.attachments.length; i++) {
      let attachment = {
        'id': result.attachments[i].id,
        'location': result.attachments[i].location,
        'content': null
      };
      let fileReader = new FileReader();
      fileReader.readAsDataURL(result.attachments[i].content);
      fileReader.onload = function(e) {
        attachment.content = e.target.result;
        mmsMessage.attachments.push(attachment);
        if (mmsMessage.attachments.length == result.attachments.length) {
          jsonCmd.result = RS_OK;
          let smsData = JSON.stringify(mmsMessage);
          sendCallback(socket, jsonCmd, smsData);
        }
      }
    }
  };
  request.onerror = function(event) {
    jsonCmd.result = RS_ERROR.SMS_GETMESSAGE;
    sendCallback(socket, jsonCmd, null);
  };
}

function markReadMessageById(socket, jsonCmd, sendCallback, recvData) {
  var smsId = recvData;
  var messageId = parseInt(smsId);
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  var request = _mozMobileMessage.markMessageRead(messageId, true);
  request.onsuccess = function(event) {
    jsonCmd.result = RS_OK;
    sendCallback(socket, jsonCmd, null);
  };
  request.onerror = function(event) {
    jsonCmd.result = RS_ERROR.SMS_MARDREAD;
    sendCallback(socket, jsonCmd, null);
  };
}

function sendSMS(socket, jsonCmd, sendCallback, recvData) {
  var requests;
  var message = JSON.parse(recvData);
  if (!Array.isArray(message.number)) {
    debug('SmsHelper.js smsHelper sendSMS isArray: ' + message.number);
    message.number = [message.number];
  }
  debug('SmsHelper.js smsHelper sendSMS: ' + typeof(message.number) + '_' + message.number);
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  var i = 0;
  var requests = _mozMobileMessage.send(message.number, message.message);
  var numberOfRequests = requests.length;
  requests.forEach(function(request, idx) {
    request.onsuccess = function onSuccess(event) {
      if (i === numberOfRequests - 1) {
        jsonCmd.result = RS_OK;
        sendCallback(socket, jsonCmd, null);
      }
      i++;
    };
    request.onerror = function onError(event) {
      if (i === numberOfRequests - 1) {
        jsonCmd.result = RS_OK;
        sendCallback(socket, jsonCmd, null);
      }
      i++;
    };
  });
}

function sendMMS(socket, jsonCmd, sendCallback, recvData) {
  var request;
  var message = JSON.parse(recvData);
  if (!Array.isArray(message.number)) {
    message.number = [message.number];
  }
  //message.content = slides = [slide1,slide2,...]
  //slide = { name: attachment.location, blob: attachment.content };
  var messageContent = SMIL.generate(message.content);
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  request = _mozMobileMessage.sendMMS({
    subject: '',
    receivers: message.number,
    smil: messageContent.smil,
    attachments: messageContent.attachments
  });
  request.onsuccess = function onSuccess(event) {
    jsonCmd.result = RS_OK;
    sendCallback(socket, jsonCmd, null);
  };

  request.onerror = function onError(event) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  };
}

function resendMessage(socket, jsonCmd, sendCallback, recvData) {
  var request;
  var message = JSON.parse(recvData);
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  if (message.type === 'sms') {
    request = _mozMobileMessage.send(message.number, message.body);
  }
  if (message.type === 'mms') {
    for (var i = 0; i < message.attachments.length; i++) {
      message.attachments[i].content = dataUri2Blob(message.attachments[i].content);
    }
    request = this._mozMobileMessage.sendMMS({
      receivers: message.number,
      subject: message.subject,
      smil: message.smil,
      attachments: message.attachments
    });
  }
  request.onsuccess = function onSuccess(evt) {
    _mozMobileMessage.delete(parseInt(message.id));
    jsonCmd.result = RS_OK;
    //var messagesData = JSON.stringify(evt.target.result);
    sendCallback(socket, jsonCmd, null);
  };
  request.onerror = function onError(evt) {
    _mozMobileMessage.delete(parseInt(message.id));
    jsonCmd.result = RS_ERROR.SMS_DELETEMESSAGE;
    //var messagesData = JSON.stringify(evt.target.error);
    sendCallback(socket, jsonCmd, null);
  };
  return;
}