/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage pic files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var photoDB = null;
var bRename = false;
var oldName = null;

function pictureHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "addPicture":
      {
        addPicture(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "deletePictureByPath":
      {
        deletePictureByPath(jsonCmd, sendCallback);
        break;
      }
    case "getAllPicturesInfo":
      {
        getAllPicturesInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getPictureByPath":
      {
        getPictureByPath(jsonCmd, sendCallback, sendList);
        break;
      }
    case "initPicture":
      {
        initPicture(jsonCmd, sendCallback);
        break;
      }
    case "renamePicture":
      {
        renamePicture(jsonCmd, sendCallback);
        break;
      }
    default:
      {
        debug('PictureHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('PictureHelper.js pictureHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addPicture(jsonCmd, sendCallback, sendList, recvList) {
  doAdd(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data[1], jsonCmd.exdatalength);
}

function doAdd(jsonCmd, sendCallback, sendList, recvList, picData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        picData += recvList[0];
        remainder -= recvList[0].length;
        recvList.remove(0);
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, picData, remainder));
      } else {
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, picData, remainder), 20);
      }
    } else {
      photoDB.addFile(jsonCmd.data[0], dataUri2Blob(picData));
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    }
  } catch (e) {
    debug('PictureHelper.js addPicture failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function deletePictureByPath(jsonCmd, sendCallback) {
  try {
    photoDB.deleteFile(jsonCmd.data);
    jsonCmd.result = RS_OK;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  } catch (e) {
    debug('PictureHelper.js deletePictureByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllPicturesInfo(jsonCmd, sendCallback, sendList) {
  try {
    photoDB.getAll(function(records) {
      var photos = records;
      var result = [];
      for (var i = 0; i < photos.length; i++) {
        var fileInfo = {
          'name': photos[i].name,
          'type': photos[i].type,
          'size': photos[i].size,
          'date': photos[i].date
        };
        result.push(fileInfo);
      }
      jsonCmd.result = RS_OK;
      var picsData = JSON.stringify(result);
      if (picsData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = picsData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = picsData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = picsData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < picsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < picsData.length) {
            sendList.push(picsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(picsData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    });
  } catch (e) {
    debug('PictureHelper.js getAllPicturesInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getPictureByPath(jsonCmd, sendCallback, sendList) {
  try {
    photoDB.getFile(jsonCmd.data, function getPic(file) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function fileLoad(e) {
        jsonCmd.result = RS_OK;
        var picsData = JSON.stringify(e.target.result);
        if (picsData.length <= MAX_PACKAGE_SIZE) {
          jsonCmd.data = picsData;
          jsonCmd.exdatalength = 0;
          sendCallback(jsonCmd);
        } else {
          jsonCmd.data = picsData.substr(0, MAX_PACKAGE_SIZE);
          jsonCmd.exdatalength = picsData.length - MAX_PACKAGE_SIZE;
          for (var i = MAX_PACKAGE_SIZE; i < picsData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < picsData.length) {
              sendList.push(picsData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(picsData.substr(i));
            }
          }
          sendCallback(jsonCmd);
        }
      };
    });
  } catch (e) {
    debug('PictureHelper.js getPictureByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function initPicture() {
  try {
    photoDB = new MediaDB('pictures', metadataParsers.imageMetadataParser, {
      mimeTypes: ['image/jpeg', 'image/png'],
      version: 2,
      autoscan: false,
      batchHoldTime: 350,
      batchSize: 12
    });
    photoDB.onunavailable = function(event) {
      //get all the reasons from event
      debug('PictureHelper.js photoDB is unavailable');
      jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
    photoDB.onready = function() {
      photoDB.scan();
      debug('PictureHelper.js photoDB is ready');
    };
    photoDB.onscanstart = function() {
      debug('PictureHelper.js photoDB scan start');
    };
    photoDB.onscanend = function() {
      debug('PictureHelper.js photoDB scan end');
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    debug('PictureHelper.js photoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function renamePicture(jsonCmd, sendCallback) {
  try {
    oldName = jsconCmd.data[0];
    var newFile = jsconCmd.data[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    } else {
      photoDB.getFile(oldName, function(file) {
        bRename = true;
         photoDB.oncreated = function(event) {
          debug('PictureHelper.js music file created');
          if (self.bRename) {
            self.bRename = false;
            self.photoDB.deleteFile(self.oldName);
            jsonCmd.result = RS_OK;
            jsonCmd.exdatalength = 0;
            jsonCmd.data = '';
            sendCallback(jsonCmd);
          }
        };
        photoDB.addFile(newFile, file);
      }, function(event) {
        jsonCmd.result = RS_ERROR.PICTURE_RENAME;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      });
    }
  } catch (e) {
    debug('PictureHelper.js renamePicture failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}