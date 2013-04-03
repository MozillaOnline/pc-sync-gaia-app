/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var videoDB = null;
var isVideoCreated = false;

function videoHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case VIDEO_COMMAND.addVideo:
      {
        addVideo(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case VIDEO_COMMAND.deleteVideoByPath:
      {
        deleteVideoByPath(jsonCmd, sendCallback, recvList);
        break;
      }
    case VIDEO_COMMAND.getAllVideosInfo:
      {
        getAllVideosInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case VIDEO_COMMAND.getVideoByPath:
      {
        getVideoByPath(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case VIDEO_COMMAND.initVideo:
      {
        initVideo(jsonCmd, sendCallback);
        break;
      }
    case VIDEO_COMMAND.renameVideo:
      {
        renameVideo(jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('VideoHelper.js videoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function addVideo(jsonCmd, sendCallback, sendList, recvList) {
  var videoData = recvList.shift();
  var lastDatalen = jsonCmd.datalength - videoData.length;
  doAddVideo(jsonCmd, sendCallback, sendList, recvList, videoData, lastDatalen);
}

function doAddVideo(jsonCmd, sendCallback, sendList, recvList, videoData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        var recvData = recvList.shift();
        videoData += recvData;
        remainder -= recvData.length;
        setTimeout(function() {
          doAddVideo(jsonCmd, sendCallback, sendList, recvList, videoData, remainder);
        }, 0);
      } else {
        setTimeout(function() {
          doAddVideo(jsonCmd, sendCallback, sendList, recvList, videoData, remainder);
        }, 20);
      }
    } else {
      var fileName = videoData.substr(0, jsonCmd.smallDatalength);
      var fileData = videoData.substr(jsonCmd.smallDatalength, jsonCmd.largeDatalength);
      console.log('MusicHelper.js addMusic fileName: ' + fileName);
      console.log('MusicHelper.js addMusic fileData: ' + fileData);
      videoDB.addFile(fileName, dataUri2Blob(fileData), function() {
        waitAddVideoFile(null, jsonCmd, sendCallback);
      }, function() {
        jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      });
    }
  } catch (e) {
    console.log('VideoHelper.js addVideo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function deleteVideoByPath(jsonCmd, sendCallback, recvList) {
  try {
    videoDB.deleteFile(recvList[0]);
    jsonCmd.result = RS_OK;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  } catch (e) {
    console.log('VideoHelper.js deleteVideoByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getAllVideosInfo(jsonCmd, sendCallback, sendList) {
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
      jsonCmd.smallDatalength = videosData.length;
      jsonCmd.largeDatalength = 0;
      if (videosData.length <= MAX_PACKAGE_SIZE) {
        sendCallback(jsonCmd, videosData);
      } else {
        sendCallback(jsonCmd, videosData.substr(0, MAX_PACKAGE_SIZE));
        for (var i = MAX_PACKAGE_SIZE; i < videosData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < videosData.length) {
            sendList.push(videosData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(videosData.substr(i));
          }
        }
      }
    });
  } catch (e) {
    console.log('VideoHelper.js getAllVideosInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getVideoByPath(jsonCmd, sendCallback, sendList, recvList) {
  try {
    videoDB.getFile(recvList[0], function(file) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function fileLoad(e) {
        jsonCmd.result = RS_OK;
        var videosData = JSON.stringify(e.target.result);
        jsonCmd.smallDatalength = videosData.length;
        jsonCmd.largeDatalength = 0;
        if (videosData.length <= MAX_PACKAGE_SIZE) {
          sendCallback(jsonCmd, videosData);
        } else {
          sendCallback(jsonCmd, videosData.substr(0, MAX_PACKAGE_SIZE));
          for (var i = MAX_PACKAGE_SIZE; i < videosData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < videosData.length) {
              sendList.push(videosData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(videosData.substr(i));
            }
          }
        }
      };
    });
  } catch (e) {
    console.log('VideoHelper.js getVideoByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function initVideo(jsonCmd, sendCallback) {
  try {
    if (videoDB == null) {
      videoDB = new MediaDB('videos', metaDataParser);
      videoDB.onunavailable = function(event) {
        //get all the reasons from event
        console.log('VideoHelper.js videoDB is unavailable');
        jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      };
      videoDB.onready = function() {
        videoDB.scan();
        console.log('VideoHelper.js videoDB is ready');
      };
      videoDB.onscanstart = function() {
        console.log('VideoHelper.js videoDB scan start');
      };
      videoDB.onscanend = function() {
        console.log('VideoHelper.js videoDB scan end');
        jsonCmd.result = RS_OK;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      };
      videoDB.oncreated = function() {
        console.log('VideoHelper.js oncreated !!!!!!!!!!!!!!!!!!!!!!');
        self.isVideoCreated = true;
      };
    } else {
      console.log('VideoHelper.js videoDB already init');
      jsonCmd.result = RS_OK;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    }

  } catch (e) {
    console.log('VideoHelper.js videoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function waitAddVideoFile(oldFile, jsonCmd, sendCallback) {
  if (isVideoCreated == true) {
    isVideoCreated = false;
    if (oldFile && (oldFile != "")) {
      videoDB.deleteFile(oldFile);
    }
    jsonCmd.result = RS_OK;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  } else {
    setTimeout(function() {
      waitAddVideoFile(oldFile, jsonCmd, sendCallback)
    }, 20);
  }
}

function renameVideo(jsonCmd, sendCallback, recvList) {
  try {
    var jsonVideoData = JSON.parse(recvList[0]);
    var oldName = jsonVideoData[0];
    var newFile = jsonVideoData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    } else {
      videoDB.getFile(oldName, function(file) {
        videoDB.addFile(newFile, file, function() {
          waitAddVideoFile(oldName, jsonCmd, sendCallback);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
          jsonCmd.smallDatalength = 0;
          jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, null);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.VIDEO_RENAME;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      });
    }
  } catch (e) {
    console.log('VideoHelper.js renameVideo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}