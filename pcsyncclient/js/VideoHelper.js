/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var videoDB = null;

function videoHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "addVideo":
      {
        addVideo(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "deleteVideoByPath":
      {
        deleteVideoByPath(jsonCmd, sendCallback);
        break;
      }
    case "getAllVideosInfo":
      {
        getAllVideosInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getVideoByPath":
      {
        getVideoByPath(jsonCmd, sendCallback, sendList);
        break;
      }
    case "initVideo":
      {
        initVideo(jsonCmd, sendCallback);
        break;
      }
    case "renameVideo":
      {
        renameVideo(jsonCmd, sendCallback);
        break;
      }
    default:
      {
        console.log('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    console.log('VideoHelper.js videoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addVideo(jsonCmd, sendCallback, sendList, recvList) {
  doAddVideo(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data, jsonCmd.exdatalength);
}

function doAddVideo(jsonCmd, sendCallback, sendList, recvList, videoData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        videoData += recvList[0];
        remainder -= recvList[0].length;
        recvList.remove(0);
        setTimeout(function() {
          doAddVideo(jsonCmd, sendCallback, sendList, recvList, videoData, remainder);
        }, 0);
      } else {
        setTimeout(function() {
          doAddVideo(jsonCmd, sendCallback, sendList, recvList, videoData, remainder);
        }, 20);
      }
    } else {
      var jsonVideoData = JSON.parse(videoData);
      videoDB.addFile(jsonVideoData[0], dataUri2Blob(jsonVideoData[1]), function() {
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
    console.log('VideoHelper.js addVideo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function deleteVideoByPath(jsonCmd, sendCallback) {
  try {
    videoDB.deleteFile(jsonCmd.data);
    jsonCmd.result = RS_OK;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  } catch (e) {
    console.log('VideoHelper.js deleteVideoByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllVideosInfo(jsonCmd, sendCallback, sendList) {
  try {
    videoDB.getAll(function(records) {
      var videos = records;
      var result = [];
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
      var videosData = JSON.stringify(result);
      if (videosData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = videosData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = videosData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = videosData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < videosData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < videosData.length) {
            sendList.push(videosData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(videosData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    });
  } catch (e) {
    console.log('VideoHelper.js getAllVideosInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getVideoByPath(jsonCmd, sendCallback, sendList) {
  try {
    videoDB.getFile(jsonCmd.data, function(file) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function fileLoad(e) {
        jsonCmd.result = RS_OK;
        var videosData = JSON.stringify(e.target.result);
        if (videosData.length <= MAX_PACKAGE_SIZE) {
          jsonCmd.data = videosData;
          jsonCmd.exdatalength = 0;
          sendCallback(jsonCmd);
        } else {
          jsonCmd.data = videosData.substr(0, MAX_PACKAGE_SIZE);
          jsonCmd.exdatalength = videosData.length - MAX_PACKAGE_SIZE;
          for (var i = MAX_PACKAGE_SIZE; i < videosData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < videosData.length) {
              sendList.push(videosData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(videosData.substr(i));
            }
          }
          sendCallback(jsonCmd);
        }
      };
    });
  } catch (e) {
    console.log('VideoHelper.js getVideoByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function initVideo(jsonCmd, sendCallback) {
  try {
    videoDB = new MediaDB('videos', metaDataParser);
    videoDB.onunavailable = function(event) {
      //get all the reasons from event
      console.log('VideoHelper.js videoDB is unavailable');
      jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
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
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('VideoHelper.js videoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function renameVideo(jsonCmd, sendCallback) {
  try {
    var jsonVideoData = JSON.parse(jsconCmd.data);
    var oldName = jsonVideoData[0];
    var newFile = jsonVideoData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    } else {
      videoDB.getFile(oldName, function(file) {
        videoDB.addFile(newFile, file, function() {
          console.log('VideoHelper.js deleteFile oldName: ' + oldName);
          videoDB.deleteFile(oldName);
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
        jsonCmd.result = RS_ERROR.VIDEO_RENAME;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      });
    }
  } catch (e) {
    console.log('VideoHelper.js renameVideo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}