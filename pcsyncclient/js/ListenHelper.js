/*------------------------------------------------------------------------------------------------------------
 *File Name: SmsHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage Sms
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function listenHelper(socket, jsonCmd, sendCallback,  recvList) {
  try {
    console.log('listenHelper.js start');
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
    _mozMobileMessage.addEventListener('failed', function onMessageFailed(e){
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
      jsonCmd.firstDatalength = sendData.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, sendData,null);
    };
  } catch (e) {
    console.log('listenHelper.js listen failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}
