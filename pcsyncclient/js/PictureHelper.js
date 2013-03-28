/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage pic files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var photoDB = null;

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
        console.log('PictureHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    console.log('PictureHelper.js pictureHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addPicture(jsonCmd, sendCallback, sendList, recvList) {
  doAddPicture(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data, jsonCmd.exdatalength);
}

function doAddPicture(jsonCmd, sendCallback, sendList, recvList, picData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        picData += recvList[0];
        remainder -= recvList[0].length;
        recvList.remove(0);
        setTimeout(function() {
          doAddPicture(jsonCmd, sendCallback, sendList, recvList, picData, remainder);
        }, 0);
      } else {
        setTimeout(function() {
          doAddPicture(jsonCmd, sendCallback, sendList, recvList, picData, remainder);
        }, 20);
      }
    } else {
      var jsonPictureData = JSON.parse(picData);
      console.log('PictureHelper.js addPicture : ' + jsonPictureData[0]);
      photoDB.addFile(jsonPictureData[0], dataUri2Blob(jsonPictureData[1]), function() {
        jsonCmd.result = RS_OK;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      }, function() {
        jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      });
    }
  } catch (e) {
    console.log('PictureHelper.js addPicture failed: ' + e);
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
    console.log('PictureHelper.js deletePictureByPath failed: ' + e);
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
    console.log('PictureHelper.js getAllPicturesInfo failed: ' + e);
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
    console.log('PictureHelper.js getPictureByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function initPicture(jsonCmd, sendCallback) {
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
      console.log('PictureHelper.js photoDB is unavailable');
      jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
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
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('PictureHelper.js photoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function renamePicture(jsonCmd, sendCallback) {
  try {
    var jsonPictureData = JSON.parse(jsonCmd.data);
    var oldName = jsonPictureData[0];
    var newFile = jsonPictureData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    } else {
      photoDB.getFile(oldName, function(file) {
        photoDB.addFile(newFile, file, function() {
          console.log('PictureHelper.js deleteFile oldName: ' + oldName);
          photoDB.deleteFile(oldName);
          jsonCmd.result = RS_OK;
          jsonCmd.exdatalength = 0;
          jsonCmd.data = '';
          sendCallback(jsonCmd);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
          jsonCmd.exdatalength = 0;
          jsonCmd.data = '';
          sendCallback(jsonCmd);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.PICTURE_RENAME;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      });
    }
  } catch (e) {
    console.log('PictureHelper.js renamePicture failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}