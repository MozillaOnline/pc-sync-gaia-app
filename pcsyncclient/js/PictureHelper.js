/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage picture files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var photoDB = null;
function pictureHelper(socket, jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case PICTURE_COMMAND.getAllPicturesInfo:
      {
        getAllPicturesInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case PICTURE_COMMAND.getPicturePosterByName:
      {
        getPicturePosterByName(socket, jsonCmd, sendCallback, recvList);
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

function getAllPicturesInfo(socket, jsonCmd, sendCallback) {
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
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      };
      photoDB.onready = function() {
        photoDB.scan();
        console.log('PictureHelper.js photoDB is ready');
      };
      photoDB.onscanend = function() {
        console.log('PictureHelper.js photoDB scan end');
        photoDB.getAll(function(records) {
          var photos = records;
          var result = [];
          for (var i = 0; i < photos.length; i++) {
            var fileInfo = {
              'name': photos[i].name,
              'type': photos[i].type,
              'size': photos[i].size,
              'date': photos[i].date,
              'metadata': photos[i].metadata
            };
            result.push(fileInfo);
          }
          jsonCmd.result = RS_OK;
          var picturesData = JSON.stringify(result);
          jsonCmd.firstDatalength = picturesData.length;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, picturesData, null);
        });
      };
  } catch (e) {
    console.log('PictureHelper.js photoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getPicturePosterByName(socket, jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    if(photoDB && fileName) {
      photoDB.getAll(function(records) {
        var photos = records;
        console.log('PictureHelper.js photos.length: ' + photos.length);
        for (var i = 0; i < photos.length; i++) {
          if(photos[i].name == fileName) {
            var imageblob = photos[i].metadata.thumbnail;
            if (imageblob != null) {
              var fileReader = new FileReader();
              fileReader.readAsDataURL(imageblob);
              fileReader.onload = function(e) {
                console.log('PictureHelper.js e.target.result: ' + e.target.result);
                jsonCmd.result = RS_OK;
                jsonCmd.firstDatalength = e.target.result.length;
                jsonCmd.secondDatalength = 0;
                sendCallback(socket, jsonCmd, e.target.result, null);
              }
            } else {
              jsonCmd.result = RS_OK;
              jsonCmd.firstDatalength = 0;
              jsonCmd.secondDatalength = 0;
              sendCallback(socket, jsonCmd, null, null);
            }
            return;
          }
        }
        jsonCmd.result = RS_ERROR.FILE_GET;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      });
    }
  } catch (e) {
    console.log('PictureHelper.js photoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}