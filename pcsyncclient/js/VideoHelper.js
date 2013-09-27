/*------------------------------------------------------------------------------------------------------------
 *File Name: VideoHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage video files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var videoDB = null;

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

var count = 0;
var index = 0;
var selfsocket = null;
var selfjsonCmd = null;
var selfsendCallback = null;

function getVideoList(socket, jsonCmd, sendCallback) {
  selfsocket = socket;
  selfjsonCmd = jsonCmd;
  selfsendCallback = sendCallback;
  videoDB.enumerate('date', null, 'prev', function(video) {
    if (video) {
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
        addVideo(video);
      }
    } else {
      if (count == index) {
        multiReplyFinish(socket, 'video', jsonCmd, sendCallback);
      } else {
        count = 0;
      }
    }
  });
}

function addVideo(video) {
  var socket = selfsocket;
  var jsonCmd = selfjsonCmd;
  var sendCallback = selfsendCallback;
  console.log('VideoHelper.js addVideo video: ' + typeof(video.metadata.poster));
  count++;
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
      jsonCmd.result = RS_MIDDLE;
      var videoData = JSON.stringify(videoMessage);
      sendCallback(socket, jsonCmd, videoData);
      index++;
    } else {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(imageblob);
      fileReader.onload = function(e) {
        videoMessage.detail.metadata.poster = e.target.result;
        jsonCmd.result = RS_MIDDLE;
        var videoData = JSON.stringify(videoMessage);
        sendCallback(socket, jsonCmd, videoData);
        index++;
        if (count == 0) {
          multiReplyFinish(socket, 'video', jsonCmd, sendCallback);
        }
      }
    }
  } else {
    jsonCmd.result = RS_MIDDLE;
    var videoData = JSON.stringify(videoMessage);
    sendCallback(socket, jsonCmd, videoData);
    index++;
  }
}

function getOldVideosInfo(socket, jsonCmd, sendCallback) {
  try {
    var selfSocket = socket;
    var selfJsonCmd = jsonCmd;
    var selfSendCallback = sendCallback;
    if (videoDB == null) {
      videoDB = new MediaDB('videos');
      videoDB.onunavailable = function(event) {
        var videoMessage = {
          type: 'video',
          callbackID: 'onunavailable',
          detail: event.detail
        };
        selfJsonCmd.result = RS_OK;
        var sendData = JSON.stringify(videoMessage);
        selfSendCallback(selfSocket, selfJsonCmd, sendData);
      };
      videoDB.oncardremoved = function oncardremoved() {
        var videoMessage = {
          type: 'video',
          callbackID: 'oncardremoved',
          detail: null
        };
        selfJsonCmd.result = RS_OK;
        var sendData = JSON.stringify(videoMessage);
        selfSendCallback(selfSocket, selfJsonCmd, sendData);
      };
      videoDB.onready = function() {
        getVideoList(selfSocket, selfJsonCmd, selfSendCallback);
      };
    } else {
      getVideoList(selfSocket, selfJsonCmd, selfSendCallback);
    }
  } catch (e) {
    console.log('VideoHelper.js videoDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function createVideo(video) {
  var socket = selfsocket;
  var jsonCmd = selfjsonCmd;
  var sendCallback = selfsendCallback;

  var fileInfo = {
    'name': video.name,
    'type': video.type,
    'size': video.size,
    'date': video.date,
    'metadata': video.metadata
  };
  var videoMessage = {
    type: 'video',
    callbackID: 'oncreated',
    detail: fileInfo
  };
  var imageblob = video.metadata.bookmark || video.metadata.poster;
  if (imageblob != null) {
    var fileReader = new FileReader();
    fileReader.readAsDataURL(imageblob);
    fileReader.onload = function(e) {
      videoMessage.detail.metadata.poster = e.target.result;
      jsonCmd.result = RS_MIDDLE;
      var sendData = JSON.stringify(videoMessage);
      sendCallback(socket, jsonCmd, sendData);
    }
  } else {
    jsonCmd.result = RS_MIDDLE;
    var sendData = JSON.stringify(videoMessage);
    sendCallback(socket, jsonCmd, sendData);
  }
}

function getChangedVideosInfo(socket, jsonCmd, sendCallback) {
  selfsocket = socket;
  selfjsonCmd = jsonCmd;
  selfsendCallback = sendCallback;
  if (!videoDB) {
    jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  videoDB.oncreated = function(event) {
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
    selfjsonCmd.result = RS_MIDDLE;
    var sendData = JSON.stringify(videoMessage);
    selfsendCallback(selfsocket, selfjsonCmd, sendData);
  };
  videoDB.onscanend = function onscanend() {
    var videoMessage = {
      type: 'video',
      callbackID: 'onscanend',
      detail: null
    };
    selfjsonCmd.result = RS_OK;
    var sendData = JSON.stringify(videoMessage);
    selfsendCallback(selfsocket, selfjsonCmd, sendData);
  };
  videoDB.scan();
}