/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage picture files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var photoDB = null;
var isPictureCreated = false;

function pictureHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case PICTURE_COMMAND.addPicture:
      {
        addPicture(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case PICTURE_COMMAND.deletePictureByPath:
      {
        deletePictureByPath(jsonCmd, sendCallback, recvList);
        break;
      }
    case PICTURE_COMMAND.getAllPicturesInfo:
      {
        getAllPicturesInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case PICTURE_COMMAND.getPictureByPath:
      {
        getPictureByPath(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case PICTURE_COMMAND.initPicture:
      {
        initPicture(jsonCmd, sendCallback);
        break;
      }
    case PICTURE_COMMAND.renamePicture:
      {
        renamePicture(jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('PictureHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('PictureHelper.js pictureHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function addPicture(jsonCmd, sendCallback, sendList, recvList) {
  var pictureData = recvList.shift();
  var lastDatalen = jsonCmd.datalength - pictureData.length;
  doAddPicture(jsonCmd, sendCallback, sendList, recvList, pictureData, lastDatalen);
}

function doAddPicture(jsonCmd, sendCallback, sendList, recvList, pictureData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        var recvData = recvList.shift();
        pictureData += recvData;
        remainder -= recvData.length;
        setTimeout(function() {
          doAddPicture(jsonCmd, sendCallback, sendList, recvList, pictureData, remainder);
        }, 0);
      } else {
        setTimeout(function() {
          doAddPicture(jsonCmd, sendCallback, sendList, recvList, pictureData, remainder);
        }, 20);
      }
    } else {
      var fileName = pictureData.substr(0, jsonCmd.smallDatalength);
      var fileData = pictureData.substr(jsonCmd.smallDatalength, jsonCmd.largeDatalength);
      console.log('MusicHelper.js addMusic fileName: ' + fileName);
      console.log('MusicHelper.js addMusic fileData: ' + fileData);
      photoDB.addFile(fileName, dataUri2Blob(fileData), function() {
        waitAddPictureFile(null, jsonCmd, sendCallback);
      }, function() {
        jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      });
    }
  } catch (e) {
    console.log('PictureHelper.js addPicture failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function deletePictureByPath(jsonCmd, sendCallback, recvList) {
  try {
    photoDB.deleteFile(recvList[0]);
    jsonCmd.result = RS_OK;
jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  } catch (e) {
    console.log('PictureHelper.js deletePictureByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
  jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
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
      var picturesData = JSON.stringify(result);
      jsonCmd.smallDatalength = picturesData.length;
        jsonCmd.largeDatalength = 0;
      if (picturesData.length <= MAX_PACKAGE_SIZE) {
        sendCallback(jsonCmd, picturesData);
      } else {
        sendCallback(jsonCmd, picturesData.substr(0, MAX_PACKAGE_SIZE));
        for (var i = MAX_PACKAGE_SIZE; i < picturesData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < picturesData.length) {
            sendList.push(picturesData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(picturesData.substr(i));
          }
        }
      }
    });
  } catch (e) {
    console.log('PictureHelper.js getAllPicturesInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getPictureByPath(jsonCmd, sendCallback, sendList, recvList) {
  try {
    photoDB.getFile(recvList[0], function (file) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function fileLoad(e) {
        jsonCmd.result = RS_OK;
        var picturesData = JSON.stringify(e.target.result);
        jsonCmd.smallDatalength = picturesData.length;
        jsonCmd.largeDatalength = 0;
        if (picturesData.length <= MAX_PACKAGE_SIZE) {
          sendCallback(jsonCmd, picturesData);
        } else {
          sendCallback(jsonCmd, picturesData.substr(0, MAX_PACKAGE_SIZE));
          for (var i = MAX_PACKAGE_SIZE; i < picturesData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < picturesData.length) {
              sendList.push(picturesData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(picturesData.substr(i));
            }
          }
        }
      };
    });
  } catch (e) {
    console.log('PictureHelper.js getPictureByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function initPicture(jsonCmd, sendCallback) {
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
     jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      };
      photoDB.onready = function() {
        photoDB.scan();
        console.log('PictureHelper.js photoDB is ready');
      };
      photoDB.onscanstart = function() {
        console.log('PictureHelper.js photoDB scan start');
      };
      photoDB.onscanend = function() {
        console.log('PictureHelper.js photoDB scan end');
        jsonCmd.result = RS_OK;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      };
      photoDB.oncreated = function() {
        console.log('PictureHelper.js oncreated !!!!!!!!!!!!!!!!!!!!!!');
        self.isPictureCreated = true;
      };
    } else {
      jsonCmd.result = RS_OK;
 jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    }

  } catch (e) {
    console.log('PictureHelper.js photoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
  jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function waitAddPictureFile(oldFile, jsonCmd, sendCallback) {
  if (isPictureCreated == true) {
    isPictureCreated = false;
    if (oldFile && (oldFile != "")) {
      photoDB.deleteFile(oldFile);
    }
    jsonCmd.result = RS_OK;
  jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  } else {
    setTimeout(function() {
      waitAddPictureFile(oldFile, jsonCmd, sendCallback)
    }, 20);
  }
}

function renamePicture(jsonCmd, sendCallback, recvList) {
  try {
    var jsonPictureData = JSON.parse(recvList[0]);
    var oldName = jsonPictureData[0];
    var newFile = jsonPictureData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
     jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    } else {
      photoDB.getFile(oldName, function(file) {
        photoDB.addFile(newFile, file, function() {
          waitAddPictureFile(oldName, jsonCmd, sendCallback);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
         jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, null);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.PICTURE_RENAME;
   jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      });
    }
  } catch (e) {
    console.log('PictureHelper.js renamePicture failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}