/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/
var videosIndex = 0;
var videosEnumerateDone = false;
function videoHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    switch (jsonCmd.command) {
    case VIDEO_COMMAND.getOldVideosInfo:
      {
        getOldVideosInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case VIDEO_COMMAND.getChangedVideosInfo:
      {
        getChangedVideosInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case VIDEO_COMMAND.deleteVideo:
      {
        deleteVideo(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    default:
      {
        debug('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('VideoHelper.js videoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function addVideo(video) {
  if (!video || !video.metadata.isVideo) {
    return;
  }
  curJsonCmd.result = RS_OK;
  sendVideo(curSocket, curJsonCmd, curSendCallback, video);
}

function getOldVideosInfo(socket, jsonCmd, sendCallback) {
  if (!videoDB) {
    isReadyVideoDB = false;
    videoDB = new MediaDB('videos', null, {
      autoscan: false,
      excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/
    });
    videoDB.onunavailable = function(event) {
      isReadyVideoDB = false;
    };
    videoDB.oncardremoved = function oncardremoved() {
      isReadyVideoDB = false;
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
        sendCallback(socket, jsonCmd, JSON.stringify(videoMessage));
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
      // If we've parsed the metadata and know this is a video, display it.
      if (isVideo === true) {
        videosCount++;
        jsonCmd.result = RS_MIDDLE;
        sendVideo(socket, jsonCmd, sendCallback, video, videosCount);
      }
    });
  };
}

function getChangedVideosInfo(socket, jsonCmd, sendCallback) {
  if (!videoDB || !isReadyVideoDB) {
    jsonCmd.result = RS_ERROR.VIDEO_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  videoDB.onscanend = function onscanend() {
    jsonCmd.result = RS_OK;
    sendCallback(socket, jsonCmd, null);
  };
  videoDB.oncreated = function(event) {
    if (!listenSocket || !listenJsonCmd || !listenSendCallback) {
      return;
    }
    event.detail.forEach(function(video) {
      addToMetadataQueue(video, false);
    });
  };
  videoDB.ondeleted = function(event) {
    if (!listenSocket || !listenJsonCmd || !listenSendCallback) {
      return;
    }
    var videoMessage = {
      type: 'video',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    listenJsonCmd.result = RS_OK;
    listenSendCallback(listenSocket, listenJsonCmd, JSON.stringify(videoMessage));
  };
  videoDB.scan();
}

function sendVideo(socket, jsonCmd, sendCallback, video, count) {
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
  var imageblob = video.metadata.bookmark || video.metadata.poster;
  if (imageblob == null) {
    videosIndex++;
    if (count && !videosEnumerateDone) {
      jsonCmd.result = RS_MIDDLE;
    } else {
      jsonCmd.result = RS_OK;
    }
    var videoData = JSON.stringify(videoMessage);
    sendCallback(socket, jsonCmd, videoData);
    return;
  }
  if (typeof(imageblob) == 'string') {
    videoMessage.detail.metadata.poster = imageblob;
    videosIndex++;
    if (count && !videosEnumerateDone) {
      jsonCmd.result = RS_MIDDLE;
    } else {
      jsonCmd.result = RS_OK;
    }
    var videoData = JSON.stringify(videoMessage);
    sendCallback(socket, jsonCmd, videoData);
  } else {
    var fileReader = new FileReader();
    fileReader.readAsDataURL(imageblob);
    fileReader.onload = function(e) {
      videoMessage.detail.metadata.poster = e.target.result;
      videosIndex++;
      if (count && !videosEnumerateDone) {
        jsonCmd.result = RS_MIDDLE;
      } else {
        jsonCmd.result = RS_OK;
      }
      var videoData = JSON.stringify(videoMessage);
      sendCallback(socket, jsonCmd, videoData);
    };
  }
}

function deleteVideo(socket, jsonCmd, sendCallback, recvData) {
  if (!isReadyVideoDB) {
    jsonCmd.result = RS_ERROR.VIDEO_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  var fileInfo = JSON.parse(recvData);
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
  sendCallback(socket, jsonCmd, null);
}