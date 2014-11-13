/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/
var videosIndex = 0;
var videosEnumerateDone = false;
function videoHelper(jsonCmd, recvData) {
  try {
    switch (jsonCmd.command) {
    case VIDEO_COMMAND.getOldVideosInfo:
      {
        getOldVideosInfo(jsonCmd);
        break;
      }
    case VIDEO_COMMAND.getChangedVideosInfo:
      {
        getChangedVideosInfo(jsonCmd);
        break;
      }
    case VIDEO_COMMAND.deleteVideo:
      {
        deleteVideo(jsonCmd, recvData);
        break;
      }
    default:
      {
        debug('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('VideoHelper.js videoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  }
}

function addVideo(video) {
  if (!video || !video.metadata.isVideo) {
    return;
  }
  sendVideo(true, null, video);
}

function getOldVideosInfo(jsonCmd) {
  if (!videoDB) {
    isReadyVideoDB = false;
    videoDB = new MediaDB('videos', null, {
      autoscan: false,
      excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/
    });
    videoDB.onunavailable = function(event) {
      isReadyVideoDB = false;
      jsonCmd.result = RS_ERROR.VIDEO_INIT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    };
    videoDB.oncardremoved = function oncardremoved() {
      isReadyVideoDB = false;
      jsonCmd.result = RS_ERROR.VIDEO_INIT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    };
    videoDB.onready = function() {
      isReadyVideoDB = true;
      videoScan();
    }
  } else if (isReadyVideoDB) {
    videoScan();
  }

  function videoScan() {
    var videosCount = 0;
    videosEnumerateDone = false;
    videosIndex = 0;
    var handle = videoDB.enumerate('date', null, 'prev', function(video) {
      if ( currentRegion == 'unconnect-region') {
        videoDB.cancelEnumeration(handle);
        return;
      }
      if (video === null) {
        var videoMessage = {
          type: 'video',
          callbackID: 'enumerate-done',
          detail: videosCount
        };
        videosEnumerateDone = true;
        if (videosCount == videosIndex) {
          jsonCmd.result = RS_OK;
        } else {
          jsonCmd.result = RS_MIDDLE;
        }
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, JSON.stringify(videoMessage));
        return;
      }
      var isVideo = video.metadata.isVideo;
      // If we know this is not a video, ignore it
      if (isVideo === false) {
        return;
      }
      // If we don't have metadata for this video yet, add it to the
      // metadata queue to get processed. Once the metadata is
      // available, it will be passed to addVideo()
      if (isVideo === undefined) {
        addToMetadataQueue(video, true);
        return;
      }
      debug('videosCount:' + videosCount);
      // If we've parsed the metadata and know this is a video, display it.
      if (isVideo === true) {
        videosCount++;
        jsonCmd.result = RS_MIDDLE;
        sendVideo(false, jsonCmd, video, videosCount);
      }
    });
  };
}

function getChangedVideosInfo(jsonCmd) {
  if (!videoDB || !isReadyVideoDB) {
    jsonCmd.result = RS_ERROR.VIDEO_INIT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
    return;
  }
  videoDB.onscanend = function onscanend() {
    jsonCmd.result = RS_OK;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
  videoDB.oncreated = function(event) {
    debug('oncreated:' + !socketWrappers[listenSocket]);
    if (!socketWrappers[listenSocket])
      return;
    event.detail.forEach(function(video) {
      addToMetadataQueue(video, false);
    });
  };
  videoDB.ondeleted = function(event) {
    if (!socketWrappers[listenSocket])
      return;
    var videoMessage = {
      type: 'video',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    var listenJsonCmd = {
      id: 0,
      type: CMD_TYPE.listen,
      command: 0,
      result: RS_OK,
      datalength: 0,
      subdatalength: 0
    };
    socketWrappers[listenSocket].send(listenJsonCmd, JSON.stringify(videoMessage));
  };
  videoDB.scan();
}

function sendVideo(isListen, jsonCmd, video, count) {
  var fileInfo = {
    'name': video.name,
    'type': video.type,
    'size': video.size,
    'date': video.date,
    'metadata': video.metadata
  };
  var videoMessage = {
    type: 'video',
    callbackID: 'enumerate',
    detail: fileInfo
  };
  debug('sendVideo:' + isListen);
  var imageblob = video.metadata.bookmark || video.metadata.poster;
  if (imageblob == null) {
    videosIndex++;
    var videoData = JSON.stringify(videoMessage);
    if (isListen) {
      if (socketWrappers[listenSocket]) {
        var listenJsonCmd = {
          id: 0,
          type: CMD_TYPE.listen,
          command: 0,
          result: 0,
          datalength: 0,
          subdatalength: 0
        };
        if (count && !videosEnumerateDone) {
          listenJsonCmd.result = RS_MIDDLE;
        } else {
          listenJsonCmd.result = RS_OK;
        }
        socketWrappers[listenSocket].send(listenJsonCmd, videoData);
      }
    } else {
      if (socketWrappers[serverSocket]){
        if (count && !videosEnumerateDone) {
          jsonCmd.result = RS_MIDDLE;
        } else {
          jsonCmd.result = RS_OK;
        }
        socketWrappers[serverSocket].send(jsonCmd, videoData);
      }
    }
    return;
  }
  if (typeof(imageblob) == 'string') {
    videoMessage.detail.metadata.poster = imageblob;
    videosIndex++;
    var videoData = JSON.stringify(videoMessage);
    if (isListen) {
      if (socketWrappers[listenSocket]) {
        var listenJsonCmd = {
          id: 0,
          type: CMD_TYPE.listen,
          command: 0,
          result: RS_OK,
          datalength: 0,
          subdatalength: 0
        };
        if (count && !videosEnumerateDone) {
          listenJsonCmd.result = RS_MIDDLE;
        } else {
          listenJsonCmd.result = RS_OK;
        }
        socketWrappers[listenSocket].send(listenJsonCmd, videoData);
      }
    } else {
      if (socketWrappers[serverSocket]){
        if (count && !videosEnumerateDone) {
          jsonCmd.result = RS_MIDDLE;
        } else {
          jsonCmd.result = RS_OK;
        }
        socketWrappers[serverSocket].send(jsonCmd, videoData);
      }
    }
  } else {
    var fileReader = new FileReader();
    fileReader.readAsDataURL(imageblob);
    fileReader.onload = function(e) {
      videoMessage.detail.metadata.poster = e.target.result;
      videosIndex++;
      var videoData = JSON.stringify(videoMessage);
      if (isListen) {
        if (socketWrappers[listenSocket]) {
          var listenJsonCmd = {
            id: 0,
            type: CMD_TYPE.listen,
            command: 0,
            result: RS_OK,
            datalength: 0,
            subdatalength: 0
          };
          if (count && !videosEnumerateDone) {
            listenJsonCmd.result = RS_MIDDLE;
          } else {
            listenJsonCmd.result = RS_OK;
          }
          socketWrappers[listenSocket].send(listenJsonCmd, videoData);
        }
      } else {
        if (socketWrappers[serverSocket]){
          if (count && !videosEnumerateDone) {
            jsonCmd.result = RS_MIDDLE;
          } else {
            jsonCmd.result = RS_OK;
          }
          socketWrappers[serverSocket].send(jsonCmd, videoData);
        }
      }
    };
  }
}

function deleteVideo(jsonCmd, recvData) {
  if (!isReadyVideoDB) {
    jsonCmd.result = RS_ERROR.VIDEO_INIT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
    return;
  }
  var fileInfo = JSON.parse(array2String(recvData));
  debug(fileInfo);
  debug(fileInfo.fileName);
  videoDB.deleteFile(fileInfo.fileName);
  if (!!fileInfo.previewName) {
    // We use raw device storage here instead of MediaDB because that is
    // what MetadataParser.js uses for saving the preview.
    var pictures = navigator.getDeviceStorage('pictures');
    pictures.delete(fileInfo.previewName);
  }
  jsonCmd.result = RS_OK;
  if (socketWrappers[serverSocket])
    socketWrappers[serverSocket].send(jsonCmd, null);
}