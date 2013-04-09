/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage picture files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var photoDB = null;
var isPictureCreated = false;

function pictureHelper(socket, jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case PICTURE_COMMAND.deletePictureByPath:
      {
        deletePictureByPath(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    case PICTURE_COMMAND.getAllPicturesInfo:
      {
        getAllPicturesInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case PICTURE_COMMAND.initPicture:
      {
        initPicture(socket, jsonCmd, sendCallback);
        break;
      }
    case PICTURE_COMMAND.renamePicture:
      {
        renamePicture(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('PictureHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
        break;
      }
    }
  } catch (e) {
    console.log('PictureHelper.js pictureHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function deletePictureByPath(socket, jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    photoDB.deleteFile(fileName);
    jsonCmd.result = RS_OK;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  } catch (e) {
    console.log('PictureHelper.js deletePictureByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getAllPicturesInfo(socket, jsonCmd, sendCallback) {
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
      var picturesData = JSON.stringify(result);
      jsonCmd.firstDatalength = picturesData.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, picturesData, null);

    });
  } catch (e) {
    console.log('PictureHelper.js getAllPicturesInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function initPicture(socket, jsonCmd, sendCallback) {
  try {
    if (photoDB == null) {
      photoDB = new MediaDB('pictures', metadataParsers.imageMetadataParser, {
        mimeTypes: ['image/jpeg', 'image/png'],
        version: 2,
        autoscan: false,
        batchHoldTime: 350,
        batchSize: 12
      });
      photoDB.onunavailable = function(event) {
        //get all the reasons from event
        console.log('PictureHelper.js photoDB is unavailable');
        jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      };
      photoDB.onready = function() {
        self.photoDB.scan();
        console.log('PictureHelper.js photoDB is ready');
      };
      photoDB.onscanstart = function() {
        console.log('PictureHelper.js photoDB scan start');
      };
      photoDB.onscanend = function() {
        console.log('PictureHelper.js photoDB scan end');
        jsonCmd.result = RS_OK;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      };
      photoDB.oncreated = function() {
        console.log('PictureHelper.js oncreated !!!!!!!!!!!!!!!!!!!!!!');
        self.isPictureCreated = true;
      };
    } else {
      photoDB.scan();
    }

  } catch (e) {
    console.log('PictureHelper.js photoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function waitAddPictureFile(socket, oldFile, jsonCmd, sendCallback) {
  if (isPictureCreated == true) {
    isPictureCreated = false;
    if (oldFile && (oldFile != "")) {
      photoDB.deleteFile(oldFile);
    }
    jsonCmd.result = RS_OK;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  } else {
    setTimeout(function() {
      waitAddPictureFile(socket, oldFile, jsonCmd, sendCallback)
    }, 20);
  }
}

function renamePicture(socket, jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    var jsonPictureData = JSON.parse(fileName);
    var oldName = jsonPictureData[0];
    var newFile = jsonPictureData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    } else {
      photoDB.getFile(oldName, function(file) {
        photoDB.addFile(newFile, file, function() {
          waitAddPictureFile(socket, oldName, jsonCmd, sendCallback);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, null, null);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.PICTURE_RENAME;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      });
    }
  } catch (e) {
    console.log('PictureHelper.js renamePicture failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}