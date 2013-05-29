/*------------------------------------------------------------------------------------------------------------
 *File Name: PictureHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage picture files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/


function pictureHelper(socket, jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case PICTURE_COMMAND.getAllPicturesInfo:
      {
        getAllPicturesInfo(socket, jsonCmd, sendCallback);
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
      var photoDB = new MediaDB('pictures', metadataParsers.imageMetadataParser, {
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
              'metadate': photos[i].metadata
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