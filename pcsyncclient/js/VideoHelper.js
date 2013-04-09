/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var videoDB = null;
var isVideoCreated = false;

function videoHelper(socket,jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case VIDEO_COMMAND.deleteVideoByPath:
      {
        deleteVideoByPath(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    case VIDEO_COMMAND.getAllVideosInfo:
      {
        getAllVideosInfo(socket,jsonCmd, sendCallback);
        break;
      }
    case VIDEO_COMMAND.initVideo:
      {
        initVideo(socket,jsonCmd, sendCallback);
        break;
      }
    case VIDEO_COMMAND.renameVideo:
      {
        renameVideo(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
        break;
      }
    }
  } catch (e) {
    console.log('VideoHelper.js videoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function deleteVideoByPath(socket,jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    videoDB.deleteFile(fileName);
    jsonCmd.result = RS_OK;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  } catch (e) {
    console.log('VideoHelper.js deleteVideoByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function getAllVideosInfo(socket,jsonCmd, sendCallback) {
  try {
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
          'date': videos[i].date
        };
        result.push(fileInfo);
      }
      jsonCmd.result = RS_OK;
      console.log('VideoHelper.js JSON.stringify(result): ' + JSON.stringify(result));
      var videosData = JSON.stringify(result);
      jsonCmd.firstDatalength = videosData.length;
      jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, videosData,null);
    });
  } catch (e) {
    console.log('VideoHelper.js getAllVideosInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function initVideo(socket,jsonCmd, sendCallback) {
  try {
    if (videoDB == null) {
      videoDB = new MediaDB('videos', metaDataParser);
      videoDB.onunavailable = function(event) {
        //get all the reasons from event
        console.log('VideoHelper.js videoDB is unavailable');
        jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
      };
      videoDB.onready = function() {
        self.videoDB.scan();
        console.log('VideoHelper.js videoDB is ready');
      };
      videoDB.onscanstart = function() {
        console.log('VideoHelper.js videoDB scan start');
      };
      videoDB.onscanend = function() {
        console.log('VideoHelper.js videoDB scan end');
        jsonCmd.result = RS_OK;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
      };
      videoDB.oncreated = function() {
        console.log('VideoHelper.js oncreated !!!!!!!!!!!!!!!!!!!!!!');
        self.isVideoCreated = true;
      };
    } else {
      console.log('VideoHelper.js videoDB already init');
      videoDB.scan();
    }

  } catch (e) {
    console.log('VideoHelper.js videoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function waitAddVideoFile(socket,oldFile, jsonCmd, sendCallback) {
  if (isVideoCreated == true) {
    isVideoCreated = false;
    if (oldFile && (oldFile != "")) {
      videoDB.deleteFile(oldFile);
    }
    jsonCmd.result = RS_OK;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  } else {
    setTimeout(function() {
      waitAddVideoFile(socket,oldFile, jsonCmd, sendCallback)
    }, 20);
  }
}

function renameVideo(socket,jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    var jsonVideoData = JSON.parse(fileName);
    var oldName = jsonVideoData[0];
    var newFile = jsonVideoData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
    } else {
      videoDB.getFile(oldName, function(file) {
        videoDB.addFile(newFile, file, function() {
          waitAddVideoFile(socket,oldName, jsonCmd, sendCallback);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket,jsonCmd, null,null);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.VIDEO_RENAME;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
      });
    }
  } catch (e) {
    console.log('VideoHelper.js renameVideo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}