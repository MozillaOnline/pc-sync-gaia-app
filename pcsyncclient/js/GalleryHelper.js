/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage picture files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var photoDB = null;
var curPictureSocket = null;
var curPictureJsonCmd = null;
var curPictureSendCallback = null;
var pictureCount = 0;
var pictureIndex = 0;
var isPictureCmdEnd = false;
var videostorage;

function pictureHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    switch (jsonCmd.command) {
    case PICTURE_COMMAND.getOldPicturesInfo:
      {
        getOldPicturesInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case PICTURE_COMMAND.getChangedPicturesInfo:
      {
        getChangedPicturesInfo(socket, jsonCmd, sendCallback);
        break;
      }
    default:
      {
        debug('PictureHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('PictureHelper.js pictureHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getOldPicturesInfo(socket, jsonCmd, sendCallback) {
  curPictureSocket = socket;
  curPictureJsonCmd = jsonCmd;
  curPictureSendCallback = sendCallback;
  if (photoDB != null) {
    getPicturesList();
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
    curPictureJsonCmd.result = RS_OK;
    curPictureSendCallback(curPictureSocket, curPictureJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.oncardremoved = function oncardremoved() {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'oncardremoved',
      detail: null
    };
    curPictureJsonCmd.result = RS_OK;
    curPictureSendCallback(curPictureSocket, curPictureJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.onready = function() {
    getPicturesList();
  };
}

function getChangedPicturesInfo(socket, jsonCmd, sendCallback) {
  curPictureSocket = socket;
  curPictureJsonCmd = jsonCmd;
  curPictureSendCallback = sendCallback;
  pictureCount = 0;
  pictureIndex = 0;
  isPictureCmdEnd = false;
  debug('PictureHelper.js getChangedPicturesInfo');
  if (!photoDB) {
    curPictureJsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
    curPictureSendCallback(curPictureSocket, curPictureJsonCmd, null);
    return;
  }
  photoDB.oncreated = function(event) {
    pictureCount += event.detail.length;
    event.detail.forEach(function(photo) {
      addPicture(photo);
    });
  };
  photoDB.ondeleted = function(event) {
    debug('PictureHelper.js getChangedPicturesInfo ondeleted');
    var pictureMessage = {
      type: 'picture',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    curPictureJsonCmd.result = RS_MIDDLE;
    curPictureSendCallback(curPictureSocket, curPictureJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.onscanend = function onscanend() {
    isPictureCmdEnd = true;
    if (pictureCount == pictureIndex) {
      multiReplyFinish(curPictureSocket, 'picture', curPictureJsonCmd, curPictureSendCallback);
    }
  };
  // Now that we've enumerated all the photos and videos we already know
  // about go start looking for new photos and videos.
  photoDB.scan();
}

function getPicturesList() {
  pictureCount = 0;
  pictureIndex = 0;
  isPictureCmdEnd = false;
  photoDB.enumerate('date', null, 'prev', function(photo) {
    if (!photo) {
      isPictureCmdEnd = true;
      if (pictureCount == pictureIndex) {
        multiReplyFinish(curPictureSocket, 'picture', curPictureJsonCmd, curPictureSendCallback);
      }
      return;
    }
    pictureCount++;
    addPicture(photo);
  });
}

function addPicture(photo) {
  if (photo.metadata.video) {
    pictureIndex++;
    if (isPictureCmdEnd && pictureCount == pictureIndex) {
      multiReplyFinish(curPictureSocket, 'picture', curPictureJsonCmd, curPictureSendCallback);
    }
    return;
  }
  var fileInfo = {
    'name': photo.name,
    'type': photo.type,
    'size': photo.size,
    'date': photo.date,
    'metadata': photo.metadata,
  };
  var pictureMessage = {
    type: 'picture',
    callbackID: 'enumerate',
    detail: fileInfo
  };
  var imageblob = photo.metadata.thumbnail;
  if (imageblob == null) {
    pictureIndex++;
    curPictureJsonCmd.result = RS_MIDDLE;
    curPictureSendCallback(curPictureSocket, curPictureJsonCmd, JSON.stringify(pictureMessage));
    if (isPictureCmdEnd && pictureCount == pictureIndex) {
      multiReplyFinish(curPictureSocket, 'picture', curPictureJsonCmd, curPictureSendCallback);
    }
    return;
  }
  var fileReader = new FileReader();
  fileReader.readAsDataURL(imageblob);
  fileReader.onload = function(e) {
    pictureMessage.detail.metadata.thumbnail = e.target.result;
    curPictureJsonCmd.result = RS_MIDDLE;
    curPictureSendCallback(curPictureSocket, curPictureJsonCmd, JSON.stringify(pictureMessage));
    pictureIndex++;
    if (isPictureCmdEnd && pictureCount == pictureIndex) {
      multiReplyFinish(curPictureSocket, 'picture', curPictureJsonCmd, curPictureSendCallback);
    }
  }
}