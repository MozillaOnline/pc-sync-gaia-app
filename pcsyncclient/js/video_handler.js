'use strict';

(function(exports) {

var VideoHandler = function(app) {
  this.app = app;
  this.videoDBStatus = null;
  this.videosIndex = 0;
  this.videosEnumerateDone = false;
};

VideoHandler.prototype.start = function() {
  if (this.started) {
    console.log('Video handler has been started!');
    return;
  }

  this.started = true;
  this.cachedCmd = null;

  // Initialize global variable videoDB which is used in
  // video_metadata_scripts.js
  videoDB = new MediaDB('videos', null, {
    autoscan: false,
    excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/
  });

  videoDB.onunavailable = function(event) {
    this.videoDBStatus = RS_ERROR.VIDEO_INIT;
    this.sendCachedCmd();
  }.bind(this);

  videoDB.oncardremoved = function() {
    this.videoDBStatus = RS_ERROR.VIDEO_INIT;
    this.sendCachedCmd();
  }.bind(this);

  videoDB.onready = function() {
    this.videoDBStatus = RS_OK;
    this.sendCachedCmd();
  }.bind(this);

  // Initialize global variable videostorage which is used in
  // video_metadata_scripts.js
  videostorage = navigator.getDeviceStorage('videos');

  // Initialize global variable addVideo which is used in
  // video_metadata_scripts.js
  addVideo = this.addVideo.bind(this);
};

VideoHandler.prototype.stop = function() {
  if (!this.started) {
    console.log('Video handler has been stopped!');
    return;
  }

  this.started = false;
  this.cachedCmd = null;

  videoDB = null;
  addVideo = null;
  videostorage = null;
};

VideoHandler.prototype.handleMessage = function(cmd, data) {
  try {
    switch (cmd.command) {
      case VIDEO_COMMAND.getOldVideosInfo:
        this.getVideosInfo(cmd);
        break;
      case VIDEO_COMMAND.getChangedVideosInfo:
        this.getChangedVideosInfo(cmd);
        break;
      case VIDEO_COMMAND.deleteVideo:
        this.deleteVideo(cmd, data);
        break;
      default:
        cmd.result = RS_ERROR.COMMAND_UNDEFINED;
        this.send(cmd, null);
        break;
    }
  } catch (e) {
    cmd.result = RS_ERROR.UNKNOWEN;
    this.send(cmd, null); }
};

VideoHandler.prototype.sendCachedCmd = function() {
  if (!this.cachedCmd) {
    return;
  }

  this.cachedCmd.result = this.videoDBStatus;

  if (this.videoDBStatus == RS_OK) {
    this.sendScanResult(this.cachedCmd);
  } else {
    this.send(this.cachedCmd, null);
  }
};

VideoHandler.prototype.getVideosInfo = function(cmd) {
  switch (this.videoDBStatus) {
    case RS_OK:
      this.sendScanResult(cmd);
      break;
    case RS_ERROR.VIDEO_INIT:
      cmd.result = RS_ERROR.VIDEO_INIT;
      this.send(cmd, null);
      break;
    default:
      this.cachedCmd = cmd;
      break;
  }
};

VideoHandler.prototype.sendScanResult = function(cmd) {
  var videosCount = 0;
  this.videosEnumerateDone = false;
  this.videosIndex = 0;

  var handle = videoDB.enumerate('date', null, 'prev', function(video) {
    if (!this.app.started) {
      this.videoDB.cancelEnumeration(handle);
      return;
    }

    if (video === null) {
      var videoMessage = {
        type: 'video',
        callbackID: 'enumerate-done',
        detail: videosCount
      };

      this.videosEnumerateDone = true;

      cmd.result = videosCount == this.videosIndex ? RS_OK : RS_MIDDLE;
      this.send(cmd, JSON.stringify(videoMessage));
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
      cmd.result = RS_MIDDLE;
      this.sendVideo(false, cmd, video, videosCount);
    }
  }.bind(this));
};

VideoHandler.prototype.getChangedVideosInfo = function(cmd) {
  if (!videoDB || this.videoDBStatus != RS_OK) {
    cmd.result = RS_ERROR.VIDEO_INIT;
    this.send(cmd, null);
    return;
  }

  videoDB.onscanend = function onscanend() {
    cmd.result = RS_OK;
    this.send(cmd, null);
  }.bind(this);

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
    var listenJsonCmd = {
      id: 0,
      type: CMD_TYPE.listen,
      command: 0,
      result: RS_OK,
      datalength: 0,
      subdatalength: 0
    };
    this.sendUpdated(listenJsonCmd, JSON.stringify(videoMessage));
  }.bind(this);
  videoDB.scan();
};

VideoHandler.prototype.sendVideo = function(isListen, jsonCmd, video) {
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

  var listenJsonCmd = {
    id: 0,
    type: CMD_TYPE.listen,
    command: 0,
    result: 0,
    datalength: 0,
    subdatalength: 0
  };

  var imageBlob = video.metadata.bookmark || video.metadata.poster;

  if (imageBlob == null) {
    this.videosIndex++;
    var videoData = JSON.stringify(videoMessage);
    if (isListen) {
      listenJsonCmd.result = this.videosEnumerateDone ? RS_OK : RS_MIDDLE;
      this.sendUpdated(listenJsonCmd, videoData);
    } else {
      jsonCmd.result = this.videosEnumerateDone ? RS_OK : RS_MIDDLE;
      this.send(jsonCmd, videoData);
    }
    return;
  }

  if (typeof(imageBlob) == 'string') {
    videoMessage.detail.metadata.poster = imageBlob;
    this.videosIndex++;
    var videoData = JSON.stringify(videoMessage);
    if (isListen) {
      listenJsonCmd.result = this.videosEnumerateDone ? RS_OK : RS_MIDDLE;
      this.sendUpdated(listenJsonCmd, videoData);
    } else {
      jsonCmd.result = this.videosEnumerateDone ? RS_OK : RS_MIDDLE;
      this.send(jsonCmd, videoData);
    }
  } else {
    var fileReader = new FileReader();
    fileReader.readAsDataURL(imageBlob);
    fileReader.onload = function(e) {
      videoMessage.detail.metadata.poster = e.target.result;
      this.videosIndex++;
      var videoData = JSON.stringify(videoMessage);
      if (isListen) {
        listenJsonCmd.result = this.videosEnumerateDone ? RS_OK : RS_MIDDLE;
        this.sendUpdated(listenJsonCmd, videoData);
      } else {
        jsonCmd.result = this.videosEnumerateDone ? RS_OK : RS_MIDDLE;
        this.send(jsonCmd, videoData);
      }
    }.bind(this);
  }
};

VideoHandler.prototype.deleteVideo = function(cmd, data) {
  if (this.videoDBStatus != RS_OK) {
    cmd.result = RS_ERROR.VIDEO_INIT;
    this.send(cmd, null);
    return;
  }

  var fileInfo = JSON.parse(array2String(data));
  videoDB.deleteFile(fileInfo.fileName);
  if (!!fileInfo.previewName) {
    // We use raw device storage here instead of MediaDB because that is
    // what MetadataParser.js uses for saving the preview.
    var picStorage = navigator.getDeviceStorage('pictures');
    picStorage.delete(fileInfo.previewName);
  }

  cmd.result = RS_OK;
  this.send(cmd, null);
};

VideoHandler.prototype.addVideo = function(video) {
  if (!video || !video.metadata.isVideo) {
    return;
  }
  this.sendVideo(true, null, video);
};

// Send data from dataSocket.
VideoHandler.prototype.send = function(cmd, data) {
  if (this.app.serverManager.dataSocketWrapper) {
    this.app.serverManager.dataSocketWrapper.send(cmd, data);
  }
};

// Send data from mainSocket.
VideoHandler.prototype.sendUpdated = function(cmd, data) {
  if (this.app.serverManager.mainSocketWrapper) {
    this.app.serverManager.mainSocketWrapper.send(cmd, data);
  }
};

exports.VideoHandler = VideoHandler;
})(window);
