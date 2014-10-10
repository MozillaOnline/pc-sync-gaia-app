/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage picture files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/
var picturesIndex = 0;
var picturesEnumerateDone = false;
var videostorage = null;
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
    case PICTURE_COMMAND.deletePicture:
      {
        deletePicture(socket, jsonCmd, sendCallback, recvData);
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
  if (!videostorage)
    videostorage = navigator.getDeviceStorage('videos');
  if (!photoDB) {
    isReadyPhotoDB = false;
    photoDB = new MediaDB('pictures', metadataParser, {
      version: 2,
      autoscan: false,
      batchHoldTime: 50,
      batchSize: 15
    });
    photoDB.onunavailable = function(event) {
      isReadyPhotoDB = false;
    };
    photoDB.oncardremoved = function oncardremoved() {
      isReadyPhotoDB = false;
    };
    photoDB.onready = function() {
      isReadyPhotoDB = true;
      photoScan();
    }
  } else if (isReadyPhotoDB) {
    photoScan();
  }
  function photoScan() {
    var picturesCount = 0;
    picturesEnumerateDone = false;
    picturesIndex = 0;
    var handle = photoDB.enumerate('date', null, 'prev', function(photo) {
      if ( currentRegion == 'unconnect-region') {
        photoDB.cancelEnumeration(handle);
        return;
      }
      if (!photo) {
        var pictureMessage = {
          type: 'picture',
          callbackID: 'enumerate-done',
          detail: picturesCount
        };
        picturesEnumerateDone = true;
        if (picturesCount == picturesIndex) {
          jsonCmd.result = RS_OK;
        } else {
          jsonCmd.result = RS_MIDDLE;
        }
        debug('PictureHelper.js pictureHelper picturesCount detail: ' + picturesCount);
        sendCallback(socket, jsonCmd, JSON.stringify(pictureMessage));
        return;
      }
      if (photo.metadata.video) {
        return;
      }
      picturesCount++;
      debug('PictureHelper.js pictureHelper picturesCount: ' + picturesCount);
      jsonCmd.result = RS_MIDDLE;
      sendPicture(socket, jsonCmd, sendCallback, photo, picturesCount);
    });
  }
}

function sendPicture(socket, jsonCmd, sendCallback, photo, count) {
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
    picturesIndex++;
    if (count && !picturesEnumerateDone) {
      jsonCmd.result = RS_MIDDLE;
    } else {
      jsonCmd.result = RS_OK;
    }
    sendCallback(socket, jsonCmd, JSON.stringify(pictureMessage));
    return;
  }
  var fileReader = new FileReader();
  fileReader.readAsDataURL(imageblob);
  fileReader.onload = function(e) {
    pictureMessage.detail.metadata.thumbnail = e.target.result;
    picturesIndex++;
    if (count && !picturesEnumerateDone) {
      jsonCmd.result = RS_MIDDLE;
    } else {
      jsonCmd.result = RS_OK;
    }
    sendCallback(socket, jsonCmd, JSON.stringify(pictureMessage));
  }
}

function getChangedPicturesInfo(socket, jsonCmd, sendCallback) {
  if (!photoDB || !isReadyPhotoDB) {
    jsonCmd.result = RS_ERROR.PICTURE_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  photoDB.onscanend = function onscanend() {
    jsonCmd.result = RS_OK;
    sendCallback(socket, jsonCmd, null);
  };
  photoDB.oncreated = function(event) {
    if (!listenSocket || !listenJsonCmd || !listenSendCallback) {
      return;
    }
    event.detail.forEach(function(photo) {
      if (photo.metadata.video) {
        return;
      }
      listenJsonCmd.result = RS_OK;
      sendPicture(listenSocket, listenJsonCmd, listenSendCallback, photo);
    });
  };
  photoDB.ondeleted = function(event) {
    if (!listenSocket || !listenJsonCmd || !listenSendCallback) {
      return;
    }
    var pictureMessage = {
      type: 'picture',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    listenJsonCmd.result = RS_OK;
    listenSendCallback(listenSocket, listenJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.scan();
}

function deletePicture(socket, jsonCmd, sendCallback, recvData) {
  if (!isReadyPhotoDB) {
    jsonCmd.result = RS_ERROR.PICTURE_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  var fileName = recvData;
  photoDB.deleteFile(fileName);
  jsonCmd.result = RS_OK;
  sendCallback(socket, jsonCmd, null);
}