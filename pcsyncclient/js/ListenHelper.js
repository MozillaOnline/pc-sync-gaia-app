/*------------------------------------------------------------------------------------------------------------
 *File Name: SmsHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage Sms
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function listenHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    console.log('listenHelper.js start');
    var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
    _mozMobileMessage.addEventListener('received', function onMessageReceived(e) {
      var message = e.message;
      console.log('SmsHelper.js listenMessage message: ' + message);
      if (message.messageClass === 'class-0') {
        return;
      }
      if (message.type == 'sms') {
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
        sendCallback(socket, jsonCmd, sendData);
      } else if (message.type == 'mms') {
        var mmsMessage = {
          'type': message.type,
          'id': message.id,
          'threadId': message.threadId,
          'delivery': message.delivery,
          'deliveryStatus': message.deliveryStatus,
          'sender': message.sender,
          'timestamp': message.timestamp.getTime(),
          'read': message.read,
          'receivers': message.receivers,
          'subject': message.subject,
          'smil': message.smil,
          'expiryDate': message.expiryDate,
          'attachments': []
        };
        for (var i = 0; i < message.attachments.length; i++) {
          let attachment = {
            'id': message.attachments[i].id,
            'location': message.attachments[i].location,
            'content': null
          };
          let fileReader = new FileReader();
          fileReader.readAsDataURL(message.attachments[i].content);
          fileReader.onload = function(e) {
            attachment.content = e.target.result;
            mmsMessage.attachments.push(attachment);
            if (mmsMessage.attachments.length == message.attachments.length) {
              jsonCmd.result = RS_OK;
              let sendData = JSON.stringify(mmsMessage);
              sendCallback(socket, jsonCmd, sendData);
            }
          }
        }
      }
    });
    _mozMobileMessage.addEventListener('sent', function onMessageReceived(e) {
      var message = e.message;
      console.log('SmsHelper.js listenMessage message: ' + message);
      if (message.messageClass === 'class-0') {
        return;
      }
      if (message.type == 'sms') {
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
        sendCallback(socket, jsonCmd, sendData);
      } else if (message.type == 'mms') {
        var mmsMessage = {
          'type': message.type,
          'id': message.id,
          'threadId': message.threadId,
          'delivery': message.delivery,
          'deliveryStatus': message.deliveryStatus,
          'sender': message.sender,
          'timestamp': message.timestamp.getTime(),
          'read': message.read,
          'receivers': message.receivers,
          'subject': message.subject,
          'smil': message.smil,
          'expiryDate': message.expiryDate,
          'attachments': []
        };
        for (var i = 0; i < message.attachments.length; i++) {
          let attachment = {
            'id': message.attachments[i].id,
            'location': message.attachments[i].location,
            'content': null
          };
          let fileReader = new FileReader();
          fileReader.readAsDataURL(message.attachments[i].content);
          fileReader.onload = function(e) {
            attachment.content = e.target.result;
            mmsMessage.attachments.push(attachment);
            if (mmsMessage.attachments.length == message.attachments.length) {
              jsonCmd.result = RS_OK;
              let sendData = JSON.stringify(mmsMessage);
              sendCallback(socket, jsonCmd, sendData);
            }
          }
        }
      }
    });
    _mozMobileMessage.addEventListener('failed', function onMessageFailed(e) {
      var message = e.message;
      console.log('SmsHelper.js listenMessage message: ' + message);
      if (message.messageClass === 'class-0') {
        return;
      }
      if (message.type == 'sms') {
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
        sendCallback(socket, jsonCmd, sendData);
      } else if (message.type == 'mms') {
        var mmsMessage = {
          'type': message.type,
          'id': message.id,
          'threadId': message.threadId,
          'delivery': message.delivery,
          'deliveryStatus': message.deliveryStatus,
          'sender': message.sender,
          'timestamp': message.timestamp.getTime(),
          'read': message.read,
          'receivers': message.receivers,
          'subject': message.subject,
          'smil': message.smil,
          'expiryDate': message.expiryDate,
          'attachments': []
        };
        for (var i = 0; i < message.attachments.length; i++) {
          let attachment = {
            'id': message.attachments[i].id,
            'location': message.attachments[i].location,
            'content': null
          };
          let fileReader = new FileReader();
          fileReader.readAsDataURL(message.attachments[i].content);
          fileReader.onload = function(e) {
            attachment.content = e.target.result;
            mmsMessage.attachments.push(attachment);
            if (mmsMessage.attachments.length == message.attachments.length) {
              jsonCmd.result = RS_OK;
              let sendData = JSON.stringify(mmsMessage);
              sendCallback(socket, jsonCmd, sendData);
            }
          }
        }
      }
    });
/*    this._mozMobileMessage.addEventListener('sending', this.onMessageSending);
    window.addEventListener('hashchange', this.onHashChange.bind(this));
    document.addEventListener('mozvisibilitychange',
                              this.onVisibilityChange.bind(this));*/
    navigator.mozContacts.oncontactchange = function oncontactchange(event) {
      console.log('listenHelper.js oncontactchange');
      var contactMessage = {
        type: 'contact',
        contactID: event.contactID,
        reason: event.reason
      };
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(contactMessage);
      sendCallback(socket, jsonCmd, sendData);
    };
  } catch (e) {
    console.log('listenHelper.js listen failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}