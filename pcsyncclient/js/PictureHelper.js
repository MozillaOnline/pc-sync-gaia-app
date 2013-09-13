/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage picture files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var photoDB = null;

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
        console.log('PictureHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('PictureHelper.js pictureHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getPicturesList(socket, jsonCmd, sendCallback) {
  var count = 0;
  var index = 0;
  photoDB.enumerate('date', null, 'prev', function(photo) {
    if (photo) {
      if (photo.metadata.video) {
        return;
      }
      count++;
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
      if (imageblob != null) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(imageblob);
        fileReader.onload = function(e) {
          pictureMessage.detail.metadata.thumbnail = e.target.result;
          jsonCmd.result = RS_MIDDLE;
          var pictureData = JSON.stringify(pictureMessage);
          sendCallback(socket, jsonCmd, pictureData);
          index++;
          if (count == 0) {
            done();
          }
        }
      } else {
        jsonCmd.result = RS_MIDDLE;
        var pictureData = JSON.stringify(pictureMessage);
        sendCallback(socket, jsonCmd, pictureData);
        index++;
      }
    } else {
      if (count == index) {
        done();
      } else {
        count = 0;
      }
    }
  });

  function done() {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'enumerate-done',
      detail: null
    };
    console.log('PictureHelper.js pictureHelper enumerate-done!!!!!!!!!!!!!!!!!');
    jsonCmd.result = RS_OK;
    var pictureData = JSON.stringify(pictureMessage);
    sendCallback(socket, jsonCmd, pictureData);
  }
}

function getOldPicturesInfo(socket, jsonCmd, sendCallback) {
  try {
    var selfSocket = socket;
    var selfJsonCmd = jsonCmd;
    var selfSendCallback = sendCallback;
    if (photoDB == null) {
      photoDB = new MediaDB('pictures', metadataParser, {
        version: 2,
        autoscan: false,
        batchHoldTime: 50,
        batchSize: 15
      });
      photoDB.onunavailable = function(event) {
        //get all the reasons from event
        console.log('ListenHelper.js photoDB is unavailable');
        var pictureMessage = {
          type: 'picture',
          callbackID: 'onunavailable',
          detail: event.detail
        };
        selfJsonCmd.result = RS_OK;
        var sendData = JSON.stringify(pictureMessage);
        selfSendCallback(selfSocket, selfJsonCmd, sendData);
      };
      photoDB.oncardremoved = function oncardremoved() {
        var pictureMessage = {
          type: 'picture',
          callbackID: 'oncardremoved',
          detail: null
        };
        selfJsonCmd.result = RS_OK;
        var sendData = JSON.stringify(pictureMessage);
        selfSendCallback(selfSocket, selfJsonCmd, sendData);
      };
      photoDB.onready = function() {
        getPicturesList(selfSocket, selfJsonCmd, selfSendCallback);
      };
    } else {
      getPicturesList(selfSocket, selfJsonCmd, selfSendCallback);
    }

  } catch (e) {
    console.log('PictureHelper.js photoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getChangedPicturesInfo(socket, jsonCmd, sendCallback) {
  if (!photoDB) {
    jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  var selfSocket = socket;
  var selfJsonCmd = jsonCmd;
  var selfSendCallback = sendCallback;
  photoDB.oncreated = function(event) {
    event.detail.forEach(function(photo) {
      var imageblob = photo.metadata.thumbnail;
      if (imageblob != null) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(imageblob);
        fileReader.onload = function(e) {
          var fileInfo = {
            'name': photo.name,
            'type': photo.type,
            'size': photo.size,
            'date': photo.date,
            'metadata': photo.metadata
          };
          var pictureMessage = {
            type: 'picture',
            callbackID: 'oncreated',
            detail: fileInfo
          };
          pictureMessage.detail.metadata.thumbnail = e.target.result;
          selfJsonCmd.result = RS_MIDDLE;
          var sendData = JSON.stringify(pictureMessage);
          selfSendCallback(selfSocket, selfJsonCmd, sendData);
        }
      } else {
        var fileInfo = {
          'name': photo.name,
          'type': photo.type,
          'size': photo.size,
          'date': photo.date,
          'metadata': photo.metadata
        };
        var pictureMessage = {
          type: 'picture',
          callbackID: 'oncreated',
          detail: fileInfo
        };
        selfJsonCmd.result = RS_MIDDLE;
        var sendData = JSON.stringify(pictureMessage);
        selfSendCallback(selfSocket, selfJsonCmd, sendData);
      }
    });
  };
  photoDB.ondeleted = function(event) {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    selfJsonCmd.result = RS_MIDDLE;
    var sendData = JSON.stringify(pictureMessage);
    selfSendCallback(selfSocket, selfJsonCmd, sendData);
  };
  photoDB.onscanend = function onscanend() {
    var pictureMessage = {
      type: 'picture',
      callbackID: 'onscanend',
      detail: null
    };
    selfJsonCmd.result = RS_OK;
    var pictureData = JSON.stringify(pictureMessage);
    selfSendCallback(selfSocket, selfJsonCmd, pictureData);
  };
  // Now that we've enumerated all the photos and videos we already know
  // about go start looking for new photos and videos.
  photoDB.scan();

}