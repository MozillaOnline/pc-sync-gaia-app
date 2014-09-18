/*------------------------------------------------------------------------------------------------------------
 *File Name: SmsHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage Sms
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/
var videostorage;
function listenHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    debug('listenHelper.js start');
    curSocket = socket;
    curJsonCmd = jsonCmd;
    curSendCallback = sendCallback;
    listenContact();
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
    if (!curSocket || !curJsonCmd || !curSendCallback) {
      return;
    }
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

function listenPicture() {
  debug('listenHelper.js photoDB:' + photoDB);
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
    if (!curSocket || !curJsonCmd || !curSendCallback) {
      return;
    }
    event.detail.forEach(function(photo) {
      if (photo.metadata.video) {
        return;
      }
      curJsonCmd.result = RS_OK;
      sendPicture(curSocket, curJsonCmd, curSendCallback, photo);
    });
  };
  photoDB.ondeleted = function(event) {
    if (!curSocket || !curJsonCmd || !curSendCallback) {
      return;
    }
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
  /*if (musicDB != null) {
    return;
  }*/
  if (!curSocket || !curJsonCmd || !curSendCallback) {
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
    if (!curSocket || !curJsonCmd || !curSendCallback) {
      return;
    }
    event.detail.forEach(function(music) {
      curJsonCmd.result = RS_OK;
      sendMusic(curSocket, curJsonCmd, curSendCallback, music);
    });
  };
  musicDB.ondeleted = function(event) {
    if (!curSocket || !curJsonCmd || !curSendCallback) {
      return;
    }
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
  /*if (videoDB != null) {
    return;
  }*/
  if (!curSocket || !curJsonCmd || !curSendCallback) {
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
    if (!curSocket || !curJsonCmd || !curSendCallback) {
      return;
    }
    event.detail.forEach(function(video) {
      addToMetadataQueue(video, false);
    });
  };
  videoDB.ondeleted = function(event) {
    if (!curSocket || !curJsonCmd || !curSendCallback) {
      return;
    }
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