/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var videoDB = null;
var videoCount = 0;
var videoIndex = 0;
var isVideoCmdEnd = false;
var curVideoSocket = null;
var curVideoJsonCmd = null;
var curVideoSendCallback = null;

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
    default:
      {
        console.log('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('VideoHelper.js videoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getOldVideosInfo(socket, jsonCmd, sendCallback) {
  try {
    curVideoSocket = socket;
    curVideoJsonCmd = jsonCmd;
    curVideoSendCallback = sendCallback;
    if (videoDB == null) {
      videoDB = new MediaDB('videos', null, {
        autoscan: false,
        excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/
      });
      videoDB.onunavailable = function(event) {
        var videoMessage = {
          type: 'video',
          callbackID: 'onunavailable',
          detail: event.detail
        };
        curVideoJsonCmd.result = RS_OK;
        curVideoSendCallback(curVideoSocket, curVideoJsonCmd, JSON.stringify(videoMessage));
      };
      videoDB.oncardremoved = function oncardremoved() {
        var videoMessage = {
          type: 'video',
          callbackID: 'oncardremoved',
          detail: null
        };
        curVideoJsonCmd.result = RS_OK;
        curVideoSendCallback(curVideoSocket, curVideoJsonCmd, JSON.stringify(videoMessage));
      };
      videoDB.onready = function() {
        getVideoList();
      };
    } else {
      getVideoList();
    }
  } catch (e) {
    console.log('VideoHelper.js videoDB failed: ' + e);
    curVideoJsonCmd.result = RS_ERROR.UNKNOWEN;
    curVideoSendCallback(curVideoSocket, curVideoJsonCmd, null);
  }
}

function getChangedVideosInfo(socket, jsonCmd, sendCallback) {
  curVideoSocket = socket;
  curVideoJsonCmd = jsonCmd;
  curVideoSendCallback = sendCallback;
  if (!videoDB) {
    curVideoJsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
    curVideoSendCallback(curVideoSocket, curVideoJsonCmd, null);
    return;
  }
  videoDB.oncreated = function(event) {
    console.log('VideoHelper.js oncreated event.detail: ' + event.detail.length);
    videoCount += event.detail.length;
    event.detail.forEach(function(video) {
      addToMetadataQueue(video, false);
    });
  };
  videoDB.ondeleted = function(event) {
    var videoMessage = {
      type: 'video',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    curVideoJsonCmd.result = RS_MIDDLE;
    curVideoSendCallback(curVideoSocket, curVideoJsonCmd, JSON.stringify(videoMessage));
  };
  videoDB.onscanend = function onscanend() {
    isVideoCmdEnd = true;
    if (videoIndex == videoCount) multiReplyFinish(curVideoSocket, 'video', curVideoJsonCmd, curVideoSendCallback);
  };
  //can not do it(xds)
  videoCount = 0;
  videoIndex = 0;
  isVideoCmdEnd = false;
  videoDB.scan();
}

function getVideoList() {
  videoCount = 0;
  videoIndex = 0;
  isVideoCmdEnd = false;
  videoDB.enumerate('date', null, 'prev', function(video) {
    if (video === null) {
      isVideoCmdEnd = true;
      if (videoCount == videoIndex) {
        multiReplyFinish(curVideoSocket, 'video', curVideoJsonCmd, curVideoSendCallback);
      }
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
      videoCount++;
      addToMetadataQueue(video, true);
      return;
    }
    // If we've parsed the metadata and know this is a video, display it.
    if (isVideo === true) {
      videoCount++;
      addVideo(video);
    }
  });
}

function addVideo(video) {
  if (!video || !video.metadata.isVideo) {
    videoIndex++;
    if (isVideoCmdEnd == true && videoCount == videoIndex) {
      multiReplyFinish(curVideoSocket, 'video', curVideoJsonCmd, curVideoSendCallback);
    }
    return;
  }
  console.log('VideoHelper.js addVideo video: ' + typeof(video.metadata.poster));
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
  if (imageblob != null) {
    if (typeof(imageblob) == 'string') {
      videoMessage.detail.metadata.poster = imageblob;
      curVideoJsonCmd.result = RS_MIDDLE;
      var videoData = JSON.stringify(videoMessage);
      curVideoSendCallback(curVideoSocket, curVideoJsonCmd, videoData);
      videoIndex++;
      if (isVideoCmdEnd == true && videoCount == videoIndex) {
        multiReplyFinish(curVideoSocket, 'video', curVideoJsonCmd, curVideoSendCallback);
      }
    } else {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(imageblob);
      fileReader.onload = function(e) {
        videoMessage.detail.metadata.poster = e.target.result;
        curVideoJsonCmd.result = RS_MIDDLE;
        var videoData = JSON.stringify(videoMessage);
        curVideoSendCallback(curVideoSocket, curVideoJsonCmd, videoData);
        videoIndex++;
        if (isVideoCmdEnd == true && videoCount == videoIndex) {
          multiReplyFinish(curVideoSocket, 'video', curVideoJsonCmd, curVideoSendCallback);
        }
      }
    }
  } else {
    curVideoJsonCmd.result = RS_MIDDLE;
    var videoData = JSON.stringify(videoMessage);
    curVideoSendCallback(curVideoSocket, curVideoJsonCmd, videoData);
    videoIndex++;
    if (isVideoCmdEnd == true && videoCount == videoIndex) {
      multiReplyFinish(curVideoSocket, 'video', curVideoJsonCmd, curVideoSendCallback);
    }
  }
}