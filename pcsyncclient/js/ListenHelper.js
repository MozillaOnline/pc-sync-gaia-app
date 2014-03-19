/*------------------------------------------------------------------------------------------------------------
 *File Name: SmsHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage Sms
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/
var videostorage;
var photoDB = null;
var musicDB = null;
var videoDB = null;
var isReadyPhotoDB = false;
var isReadyMusicDB = false;
var isReadyVideoDB = false;
var curSocket = null;
var curJsonCmd = null;
var curSendCallback = null;
function listenHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    debug('listenHelper.js start');
    curSocket = socket;
    curJsonCmd = jsonCmd;
    curSendCallback = sendCallback;
    listenContact();
    listenSms();
    listenPicture();
    listenMusic();
    listenVideo();
  } catch (e) {
    debug('listenHelper.js listen failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function listenContact() {
  navigator.mozContacts.oncontactchange = function oncontactchange(event) {
    debug('listenHelper.js oncontactchange');
    var contactMessage = {
      type: 'contact',
      contactID: event.contactID,
      reason: event.reason
    };
    curJsonCmd.result = RS_OK;
    var sendData = JSON.stringify(contactMessage);
    curSendCallback(curSocket, curJsonCmd, sendData);
  };
}

/*    this._mozMobileMessage.addEventListener('sending', this.onMessageSending);
    window.addEventListener('hashchange', this.onHashChange.bind(this));
    document.addEventListener('mozvisibilitychange',
                              this.onVisibilityChange.bind(this));*/
function listenSms() {
  var _mozMobileMessage = navigator.mozMobileMessage || window.DesktopMockNavigatormozMobileMessage;
  _mozMobileMessage.addEventListener('received', function onMessageReceived(e) {
    var message = e.message;
    debug('SmsHelper.js listenMessage message: ' + message);
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
        'timestamp': message.timestamp,
        'read': message.read
      };
      curJsonCmd.result = RS_OK;
      var sendData = JSON.stringify(smsMessage);
      curSendCallback(curSocket, curJsonCmd, sendData);
    } else if (message.type == 'mms') {
      var mmsMessage = {
        'type': message.type,
        'id': message.id,
        'threadId': message.threadId,
        'delivery': message.delivery,
        'deliveryStatus': message.deliveryStatus,
        'sender': message.sender,
        'timestamp': message.timestamp,
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
            curJsonCmd.result = RS_OK;
            let sendData = JSON.stringify(mmsMessage);
            curSendCallback(curSocket, curJsonCmd, sendData);
          }
        }
      }
    }
  });
  _mozMobileMessage.addEventListener('sent', function onMessageReceived(e) {
    var message = e.message;
    debug('SmsHelper.js listenMessage message: ' + message);
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
        'timestamp': message.timestamp,
        'read': message.read
      };
      curJsonCmd.result = RS_OK;
      var sendData = JSON.stringify(smsMessage);
      curSendCallback(curSocket, curJsonCmd, sendData);
    } else if (message.type == 'mms') {
      var mmsMessage = {
        'type': message.type,
        'id': message.id,
        'threadId': message.threadId,
        'delivery': message.delivery,
        'deliveryStatus': message.deliveryStatus,
        'sender': message.sender,
        'timestamp': message.timestamp,
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
            curJsonCmd.result = RS_OK;
            let sendData = JSON.stringify(mmsMessage);
            curSendCallback(curSocket, curJsonCmd, sendData);
          }
        }
      }
    }
  });
  _mozMobileMessage.addEventListener('failed', function onMessageFailed(e) {
    var message = e.message;
    debug('SmsHelper.js listenMessage message: ' + message);
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
        'timestamp': message.timestamp,
        'read': message.read
      };
      curJsonCmd.result = RS_OK;
      var sendData = JSON.stringify(smsMessage);
      curSendCallback(curSocket, curJsonCmd, sendData);
    } else if (message.type == 'mms') {
      var mmsMessage = {
        'type': message.type,
        'id': message.id,
        'threadId': message.threadId,
        'delivery': message.delivery,
        'deliveryStatus': message.deliveryStatus,
        'sender': message.sender,
        'timestamp': message.timestamp,
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
            curJsonCmd.result = RS_OK;
            let sendData = JSON.stringify(mmsMessage);
            curSendCallback(curSocket, curJsonCmd, sendData);
          }
        }
      }
    }
  });
}

function listenPicture() {
  if (photoDB != null) {
    return;
  }
  photoDB = new MediaDB('pictures', metadataParser, {
    version: 2,
    autoscan: false,
    batchHoldTime: 50,
    batchSize: 15
  });
  videostorage = navigator.getDeviceStorage('videos');
  photoDB.onunavailable = function(event) {
    isReadyPhotoDB = false;
  };
  photoDB.oncardremoved = function oncardremoved() {
    isReadyPhotoDB = false;
  };
  photoDB.onready = function() {
    isReadyPhotoDB = true;
  };
  photoDB.oncreated = function(event) {
    event.detail.forEach(function(photo) {
      if (photo.metadata.video) {
        return;
      }
      curJsonCmd.result = RS_OK;
      sendPicture(curSocket, curJsonCmd, curSendCallback, photo);
    });
  };
  photoDB.ondeleted = function(event) {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(pictureMessage));
  };
}

function listenMusic() {
  if (musicDB != null) {
    return;
  }
  musicDB = new MediaDB('music', parseAudioMetadata, {
    indexes: ['metadata.album', 'metadata.artist', 'metadata.title', 'metadata.rated', 'metadata.played', 'date'],
    batchSize: 1,
    autoscan: false,
    version: 2
  });
  musicDB.onunavailable = function(event) {
  isReadyMusicDB = false;
  };
  musicDB.oncardremoved = function oncardremoved() {
    isReadyMusicDB = false;
  };
  musicDB.onready = function() {
    isReadyMusicDB = true;
  };
  musicDB.oncreated = function(event) {
    event.detail.forEach(function(music) {
      curJsonCmd.result = RS_OK;
      sendMusic(curSocket, curJsonCmd, curSendCallback, music);
    });
  };
  musicDB.ondeleted = function(event) {
    var musicMessage = {
      type: 'music',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(musicMessage));
  };
}

function listenVideo() {
  if (videoDB != null) {
    return;
  }
  videoDB = new MediaDB('videos', null, {
    autoscan: false,
    excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/
  });
  videoDB.onunavailable = function(event) {
    isReadyVideoDB = false;
  };
  videoDB.oncardremoved = function oncardremoved() {
    isReadyVideoDB = false;
  };
  videoDB.onready = function() {
    isReadyVideoDB = true;
  };
  videoDB.oncreated = function(event) {
    event.detail.forEach(function(video) {
      addToMetadataQueue(video, false);
    });
  };
  videoDB.ondeleted = function(event) {
    var videoMessage = {
      type: 'video',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(videoMessage));
  };
}

function addVideo(video) {
  if (!video || !video.metadata.isVideo) {
    return;
  }
  curJsonCmd.result = RS_OK;
  sendVideo(curSocket, curJsonCmd, curSendCallback, video);
}