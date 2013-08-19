/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var videoDB = null;
function videoHelper(socket, jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case VIDEO_COMMAND.getAllVideosInfo:
      {
        getAllVideosInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case VIDEO_COMMAND.getVideoPosterByName:
      {
        getVideoPosterByName(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
        break;
      }
    }
  } catch (e) {
    console.log('VideoHelper.js videoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getAllVideosInfo(socket, jsonCmd, sendCallback) {
  try {
    videoDB = new MediaDB('videos', metaDataParser);
    videoDB.onunavailable = function(event) {
      //get all the reasons from event
      console.log('VideoHelper.js videoDB is unavailable');
      jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
    videoDB.onready = function() {
      videoDB.scan();
      console.log('VideoHelper.js videoDB is ready');
    };
    videoDB.onscanend = function() {
      console.log('VideoHelper.js videoDB scan end');
      videoDB.getAll(function(records) {
        var videos = records;
        var result = [];
        console.log('VideoHelper.js videos.length: ' + videos.length);
        for (var i = 0; i < videos.length; i++) {
          if (!videos[i].metadata.isVideo) {
            continue;
          }
          var fileInfo = {
            'name': videos[i].name,
            'type': videos[i].type,
            'size': videos[i].size,
            'date': videos[i].date,
            'metadate': videos[i].metadata
          };
          result.push(fileInfo);
        }
        jsonCmd.result = RS_OK;
        console.log('VideoHelper.js JSON.stringify(result): ' + JSON.stringify(result));
        var videosData = JSON.stringify(result);
        jsonCmd.firstDatalength = videosData.length;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, videosData, null);
      });
    };
  } catch (e) {
    console.log('VideoHelper.js videoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getVideoPosterByName(socket, jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    if(videoDB && fileName) {
      videoDB.getAll(function(records) {
        var videos = records;
        console.log('VideoHelper.js videos.length: ' + videos.length);
        for (var i = 0; i < videos.length; i++) {
          if (!videos[i].metadata.isVideo) {
            continue;
          }
          if(videos[i].name == fileName) {
            var imageblob = videos[i].metadata.bookmark || videos[i].metadata.poster;
            if (imageblob != null) {
              var fileReader = new FileReader();
              fileReader.readAsDataURL(imageblob);
              fileReader.onload = function(e) {
                console.log('VideoHelper.js e.target.result: ' + e.target.result);
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
    console.log('VideoHelper.js videoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}