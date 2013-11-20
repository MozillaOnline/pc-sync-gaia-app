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
        'timestamp': message.timestamp.getTime(),
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
        'timestamp': message.timestamp.getTime(),
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
        'timestamp': message.timestamp.getTime(),
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
    //get all the reasons from event
    debug('ListenHelper.js photoDB is unavailable');
    var pictureMessage = {
      type: 'picture',
      callbackID: 'onunavailable',
      detail: event.detail
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.oncardremoved = function oncardremoved() {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'oncardremoved',
      detail: null
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.onready = function() {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'onready',
      detail: null
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.oncreated = function(event) {
    event.detail.forEach(function(photo) {
      if (photo.metadata.video) {
        return;
      }
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
  photoDB.onscanend = function onscanend() {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'onscanend',
      detail: null
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
    //get all the reasons from event
    var musicMessage = {
      type: 'music',
      callbackID: 'onunavailable',
      detail: event.detail
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(musicMessage));
  };
  musicDB.oncardremoved = function oncardremoved() {
    var musicMessage = {
      type: 'music',
      callbackID: 'oncardremoved',
      detail: null
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(musicMessage));
  };
  musicDB.onready = function() {
    var musicMessage = {
      type: 'music',
      callbackID: 'onready',
      detail: null
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(musicMessage));
  };
  musicDB.oncreated = function(event) {
    event.detail.forEach(function(music) {
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
  musicDB.onscanend = function onscanend() {
    var musicMessage = {
      type: 'music',
      callbackID: 'onscanend',
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
    var videoMessage = {
      type: 'video',
      callbackID: 'onunavailable',
      detail: event.detail
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(videoMessage));
  };
  videoDB.oncardremoved = function oncardremoved() {
    var videoMessage = {
      type: 'video',
      callbackID: 'oncardremoved',
      detail: null
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(videoMessage));
  };
  videoDB.onready = function() {
    var videoMessage = {
      type: 'video',
      callbackID: 'onready',
      detail: null
    };
    curJsonCmd.result = RS_OK;
    curSendCallback(curSocket, curJsonCmd, JSON.stringify(videoMessage));
  };
  videoDB.oncreated = function(event) {
    videoCount += event.detail.length;
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
  videoDB.onscanend = function onscanend() {
    var videoMessage = {
      type: 'video',
      callbackID: 'onscanend',
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
  sendVideo(curSocket, curJsonCmd, curSendCallback, video);
}