'use strict';

(function(exports) {

var VideoHandler = function(app) {
  this.app = app;
  this.videoDBStatus = null;
  this.videosIndex = 0;
  this.videosEnumerateDone = false;
  this.cachedCmd = null;
  this.enableListening = false;
  // Initialize global variable videoDB which is used in
  // video_metadata_scripts.js
  videoDB = new MediaDB('videos', null, {
    autoscan: false,
    excludeFilter: /DCIM\/\d{3}MZLLA\/\.VID_\d{4}\.3gp$/
  });

  videoDB.onunavailable = function(event) {
    this.videoDBStatus = RS_ERROR.VIDEO_INIT;
  }.bind(this);

  videoDB.oncardremoved = function() {
    this.videoDBStatus = RS_ERROR.VIDEO_INIT;
  }.bind(this);

  videoDB.onready = function() {
    this.videoDBStatus = RS_OK;
  }.bind(this);

  // Initialize global variable videostorage which is used in
  // video_metadata_scripts.js
  videostorage = navigator.getDeviceStorage('videos');

  // Initialize global variable addVideo which is used in
  // video_metadata_scripts.js
  addVideo = this.addVideo.bind(this);

  document.addEventListener(CMD_TYPE.app_disconnect,
                            this.reset);
  document.addEventListener(CMD_TYPE.video_getOld,
                            this.getVideosInfo);
  document.addEventListener(CMD_TYPE.video_getChanged,
                            this.getChangedVideosInfo);
  document.addEventListener(CMD_TYPE.video_delete,
                            this.deleteVideo);
};

VideoHandler.prototype.reset = function() {
  this.enableListening = false;
};

VideoHandler.prototype.getVideosInfo = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.video_getOld,
    datalength: 0
  };
  switch (this.videoDBStatus) {
    case RS_OK:
      this.sendScanResult(cmd);
      break;
    case RS_ERROR.VIDEO_INIT:
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.VIDEO_INIT));
      break;
    default:
      break;
  }
};

VideoHandler.prototype.sendScanResult = function(cmd) {
  var videosCount = 0;
  this.videosEnumerateDone = false;
  this.videosIndex = 0;
  this.enableListening = false;
  var handle = videoDB.enumerate('date', null, 'prev', function(video) {
    if (!enableListening) {
      this.videoDB.cancelEnumeration(handle);
      return;
    }

    if (video === null) {
      this.videosEnumerateDone = true;
      this.app.serverManager.send(cmd, int2Array(RS_OK));
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
      this.sendVideo(false, cmd, video);
    }
  }.bind(this));
};

VideoHandler.prototype.getChangedVideosInfo = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.video_getChanged,
    datalength: 0
  };
  if (!videoDB || this.videoDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.VIDEO_INIT));
    return;
  }

  videoDB.onscanend = function onscanend() {
    this.app.serverManager.send(cmd, int2Array(RS_OK));
  }.bind(this);

  videoDB.oncreated = function(event) {
    event.detail.forEach(function(video) {
      addToMetadataQueue(video, false);
    });
  };

  videoDB.ondeleted = function(event) {
    this.app.serverManager.update(cmd,
                                  string2Array(JSON.stringify(event.detail)));
  }.bind(this);
  videoDB.scan();
};

VideoHandler.prototype.sendVideo = function(isListen, cmd, video) {
  var fileInfo = {
    'name': video.name,
    'type': video.type,
    'size': video.size,
    'date': video.date,
    'metadata': video.metadata
  };

  var imageBlob = video.metadata.bookmark || video.metadata.poster;

  if (imageBlob == null) {
    this.videosIndex++;
    var videoData = JSON.stringify(fileInfo);
    if (isListen) {
      this.app.serverManager.update(cmd, string2Array(videoData));
    } else {
      this.app.serverManager.send(cmd, string2Array(videoData));
    }
    return;
  }

  if (typeof(imageBlob) == 'string') {
    fileInfo.metadata.poster = imageBlob;
    this.videosIndex++;
    var videoData = JSON.stringify(fileInfo);
    if (isListen) {
      this.app.serverManager.update(cmd, string2Array(videoData));
    } else {
      this.app.serverManager.send(cmd, string2Array(videoData));
    }
  } else {
    var fr = new FileReader();
    fr.readAsDataURL(imageBlob);
    fr.onload = function(e) {
      fileInfo.metadata.poster = e.target.result;
      this.videosIndex++;
      var videoData = JSON.stringify(fileInfo);
      if (isListen) {
        this.app.serverManager.update(cmd, string2Array(videoData));
      } else {
        this.app.serverManager.send(cmd, string2Array(videoData));
      }
    }.bind(this);
  }
};

VideoHandler.prototype.deleteVideo = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.video_delete,
    datalength: 0
  };
  if (this.videoDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(this.videoDBStatus));
    return;
  }

  var fileInfo = JSON.parse(array2String(e.data));
  videoDB.deleteFile(fileInfo.fileName);
  if (!!fileInfo.previewName) {
    // We use raw device storage here instead of MediaDB because that is
    // what MetadataParser.js uses for saving the preview.
    var picStorage = navigator.getDeviceStorage('pictures');
    picStorage.delete(fileInfo.previewName);
  }

  this.app.serverManager.send(cmd, int2Array(RS_OK));
};

VideoHandler.prototype.addVideo = function(video) {
  if (!video || !video.metadata.isVideo) {
    return;
  }
  var responseCmd = {
    id: CMD_ID.listen_video,
    flag: CMD_TYPE.video_getChanged,
    datalength: 0
  };
  this.sendVideo(true, responseCmd, video);
};

exports.VideoHandler = VideoHandler;
})(window);
