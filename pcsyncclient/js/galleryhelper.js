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
function pictureHelper(jsonCmd, recvData) {
  try {
    switch (jsonCmd.command) {
    case PICTURE_COMMAND.getOldPicturesInfo:
      {
        getOldPicturesInfo(jsonCmd);
        break;
      }
    case PICTURE_COMMAND.getChangedPicturesInfo:
      {
        getChangedPicturesInfo(jsonCmd);
        break;
      }
    case PICTURE_COMMAND.deletePicture:
      {
        deletePicture(jsonCmd, recvData);
        break;
      }
    default:
      {
        debug('PictureHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('PictureHelper.js pictureHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  }
}

function getOldPicturesInfo(jsonCmd) {
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
      jsonCmd.result = RS_ERROR.PICTURE_INIT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    };
    photoDB.oncardremoved = function oncardremoved() {
      isReadyPhotoDB = false;
      jsonCmd.result = RS_ERROR.PICTURE_INIT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
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
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, JSON.stringify(pictureMessage));
        return;
      }
      if (photo.metadata.video) {
        return;
      }
      picturesCount++;
      debug('PictureHelper.js pictureHelper picturesCount: ' + picturesCount);
      jsonCmd.result = RS_MIDDLE;
      sendPicture(false, jsonCmd, photo, picturesCount);
    });
  }
}

function sendPicture(isListen, jsonCmd, photo, count) {
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
    if (isListen) {
      if (socketWrappers[listenSocket]) {
        var listenJsonCmd = {
          id: 0,
          type: CMD_TYPE.listen,
          command: 0,
          result: 0,
          datalength: 0,
          subdatalength: 0
        };
        if (count && !picturesEnumerateDone) {
          listenJsonCmd.result = RS_MIDDLE;
        } else {
          listenJsonCmd.result = RS_OK;
        }
        socketWrappers[listenSocket].send(listenJsonCmd, JSON.stringify(pictureMessage));
      }
    } else {
      if (socketWrappers[serverSocket]) {
        if (count && !picturesEnumerateDone) {
          jsonCmd.result = RS_MIDDLE;
        } else {
          jsonCmd.result = RS_OK;
        }
        socketWrappers[serverSocket].send(jsonCmd, JSON.stringify(pictureMessage));
      }
    }
    return;
  }
  var fileReader = new FileReader();
  fileReader.readAsDataURL(imageblob);
  fileReader.onload = function(e) {
    pictureMessage.detail.metadata.thumbnail = e.target.result;
    picturesIndex++;
    if (isListen) {
      if (socketWrappers[listenSocket]) {
        var listenJsonCmd = {
          id: 0,
          type: CMD_TYPE.listen,
          command: 0,
          result: RS_OK,
          datalength: 0,
          subdatalength: 0
        };
        if (count && !picturesEnumerateDone) {
          listenJsonCmd.result = RS_MIDDLE;
        } else {
          listenJsonCmd.result = RS_OK;
        }
        socketWrappers[listenSocket].send(listenJsonCmd, JSON.stringify(pictureMessage));
      }
    } else {
      if (socketWrappers[serverSocket]){
        if (count && !picturesEnumerateDone) {
          jsonCmd.result = RS_MIDDLE;
        } else {
          jsonCmd.result = RS_OK;
        }
        socketWrappers[serverSocket].send(jsonCmd, JSON.stringify(pictureMessage));
      }
    }
  }
}

function getChangedPicturesInfo(jsonCmd) {
  if (!photoDB || !isReadyPhotoDB) {
    jsonCmd.result = RS_ERROR.PICTURE_INIT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
    return;
  }
  photoDB.onscanend = function onscanend() {
    jsonCmd.result = RS_OK;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
  photoDB.oncreated = function(event) {
    if (!socketWrappers[listenSocket])
      return;
    event.detail.forEach(function(photo) {
      if (photo.metadata.video) {
        return;
      }
      sendPicture(true, null, photo);
    });
  };
  photoDB.ondeleted = function(event) {
    if (!socketWrappers[listenSocket])
      return;
    var pictureMessage = {
      type: 'picture',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    var listenJsonCmd = {
      id: 0,
      type: CMD_TYPE.listen,
      command: 0,
      result: RS_OK,
      datalength: 0,
      subdatalength: 0
    };
    socketWrappers[listenSocket].send(listenJsonCmd, JSON.stringify(pictureMessage));
  };
  photoDB.scan();
}

function deletePicture(jsonCmd, recvData) {
  if (!isReadyPhotoDB) {
    jsonCmd.result = RS_ERROR.PICTURE_INIT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
    return;
  }
  var fileName = array2String(recvData);
  photoDB.deleteFile(fileName);
  jsonCmd.result = RS_OK;
  if (socketWrappers[serverSocket])
    socketWrappers[serverSocket].send(jsonCmd, null);
}