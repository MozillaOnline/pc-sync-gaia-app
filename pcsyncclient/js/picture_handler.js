'use strict';

(function(exports) {

var PictureHandler = function(app) {
  this.app = app;
  this.picturesIndex = 0;
  this.picturesEnumerateDone = false;
  this.started = false;
};

PictureHandler.prototype.start = function() {
  if (this.started) {
    console.log('PictureHandler is running.');
    return;
  }

  this.started = true;
  this.photoDBStatus = null;
  this.cachedCmd = null;

  this.photoDB = new MediaDB('pictures', metadataParser, {
    version: 2,
    autoscan: false,
    batchHoldTime: 50,
    batchSize: 15
  });

  this.photoDB.onunavailable = function(event) {
    this.photoDBStatus = RS_ERROR.MUSIC_INIT;
    this.sendCachedCmd();
  }.bind(this);

  this.photoDB.oncardremoved = function() {
    this.photoDBStatus = RS_ERROR.MUSIC_INIT;
    this.sendCachedCmd();
  }.bind(this);

  this.photoDB.onready = function() {
    this.photoDBStatus = RS_OK;
    this.sendCachedCmd();
  }.bind(this);
};

PictureHandler.prototype.stop = function() {
  if (!this.started) {
    console.log('PictureHandler has been stopped.');
    return;
  }

  this.started = false;

  this.photoDBStatus = null;
  this.cachedCmd = null;
};

PictureHandler.prototype.handleMessage = function(cmd, data) {
  try {
    switch (cmd.command) {
      case PICTURE_COMMAND.getOldPicturesInfo:
        this.getPicturesInfo(cmd);
        break;
      case PICTURE_COMMAND.getChangedPicturesInfo:
        this.getChangedPicturesInfo(cmd);
        break;
      case PICTURE_COMMAND.deletePicture:
        this.deletePicture(cmd, data);
        break;
      default:
        cmd.result = RS_ERROR.COMMAND_UNDEFINED;
        this.app.serverManager.send(cmd, null);
        break;
    }
  } catch (e) {
    cmd.result = RS_ERROR.UNKNOWEN;
    this.app.serverManager.send(cmd, null);
  }
};

PictureHandler.prototype.sendCachedCmd = function() {
  if (!this.cachedCmd) {
    return;
  }

  this.cachedCmd.result = this.photoDBStatus;

  if (this.photoDBStatus == RS_OK) {
    this.sendScanResult(this.cachedCmd);
  } else {
    this.app.serverManager.send(this.cachedCmd, null);
  }
};

PictureHandler.prototype.getPicturesInfo = function(cmd) {
  switch (this.photoDBStatus) {
    case RS_OK:
      this.sendScanResult(cmd);
      break;
    case RS_ERROR.PICTURE_INIT:
      cmd.result = RS_ERROR.PICTURE_INIT;
      this.app.serverManager.send(cmd, null);
      break;
    default:
      this.cachedCmd = cmd;
      break;
  }
};

PictureHandler.prototype.sendScanResult = function(cmd) {
  var picturesCount = 0;
  this.picturesEnumerateDone = false;
  this.picturesIndex = 0;

  var handle = this.photoDB.enumerate('date', null, 'prev', function(photo) {
    if (!this.app.started) {
      this.photoDB.cancelEnumeration(handle);
      return;
    }

    if (!photo) {
      var pictureMessage = {
        type: 'picture',
        callbackID: 'enumerate-done',
        detail: picturesCount
      };
      this.picturesEnumerateDone = true;
      cmd.result = picturesCount == this.picturesIndex ? RS_OK : RS_MIDDLE;
      this.app.serverManager.send(cmd, JSON.stringify(pictureMessage));
      return;
    }
    if (photo.metadata.video) {
      return;
    }

    picturesCount++;
    cmd.result = RS_MIDDLE;
    this.sendPicture(false, cmd, photo, picturesCount);
  }.bind(this));
};

PictureHandler.prototype.sendPicture = function(isListen, cmd, photo, count) {
  var fileInfo = {
    'name': photo.name,
    'type': photo.type,
    'size': photo.size,
    'date': photo.date,
    'metadata': photo.metadata,
  };

  var pictureMessage = {
    type: 'picture',
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

  var imageBlob = photo.metadata.thumbnail;
  if (imageBlob == null) {
    this.picturesIndex++;
    if (isListen) {
      listenJsonCmd.result = this.picturesEnumeratedDone ? RS_OK : RS_MIDDLE;
      this.app.serverManager.update(listenJsonCmd, JSON.stringify(pictureMessage));
    } else {
      cmd.result = this.picturesEnumerateDone ? RS_OK : RS_MIDDLE;
      this.app.serverManager.send(cmd, JSON.stringify(pictureMessage));
    }
    return;
  }

  var fileReader = new FileReader();
  fileReader.readAsDataURL(imageBlob);
  fileReader.onload = function(e) {
    pictureMessage.detail.metadata.thumbnail = e.target.result;
    this.picturesIndex++;
    if (isListen) {
      listenJsonCmd.result = this.picturesEnumeratedDone ? RS_OK : RS_MIDDLE;
      this.app.serverManager.update(listenJsonCmd, JSON.stringify(pictureMessage));
    } else {
      cmd.result = this.picturesEnumerateDone ? RS_OK : RS_MIDDLE;
      this.app.serverManager.send(cmd, JSON.stringify(pictureMessage));
    }
  }.bind(this);
};

PictureHandler.prototype.getChangedPicturesInfo = function(cmd) {
  if (!this.photoDB || this.photoDBStatus != RS_OK) {
    cmd.result = RS_ERROR.PICTURE_INIT;
    this.app.serverManager.send(cmd, null);
    return;
  }

  this.photoDB.onscanend = function onscanend() {
    cmd.result = RS_OK;
    this.app.serverManager.send(cmd, null);
  }.bind(this);

  this.photoDB.oncreated = function(event) {
    event.detail.forEach(function(photo) {
      if (photo.metadata.video) {
        return;
      }
      this.sendPicture(true, null, photo);
    }.bind(this));
  }.bind(this);

  this.photoDB.ondeleted = function(event) {
    var pictureMessage = {
      type: 'picture',
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
    this.app.serverManager.update(listenJsonCmd, JSON.stringify(pictureMessage));
  }.bind(this);
  this.photoDB.scan();
};

PictureHandler.prototype.deletePicture = function(cmd, data) {
  if (this.photoDBStatus != RS_OK) {
    cmd.result = RS_ERROR.PICTURE_INIT;
    this.app.serverManager.send(cmd, null);
    return;
  }
  var fileName = array2String(data);
  this.photoDB.deleteFile(fileName);
  cmd.result = RS_OK;
  this.app.serverManager.send(cmd, null);
};

exports.PictureHandler = PictureHandler;

})(window);
