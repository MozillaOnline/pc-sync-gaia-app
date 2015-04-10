'use strict';

(function(exports) {

var PictureHandler = function(app) {
  this.app = app;
  this.picturesIndex = 0;
  this.picturesEnumerateDone = false;
  this.photoDBStatus = null;
  this.cachedCmd = null;
  this.enableListening = false;
  this.photoDB = new MediaDB('pictures', metadataParser, {
    version: 2,
    autoscan: false,
    batchHoldTime: 50,
    batchSize: 15
  });

  this.photoDB.onunavailable = function(event) {
    this.photoDBStatus = RS_ERROR.MUSIC_INIT;
  }.bind(this);

  this.photoDB.oncardremoved = function() {
    this.photoDBStatus = RS_ERROR.MUSIC_INIT;
  }.bind(this);

  this.photoDB.onready = function() {
    this.photoDBStatus = RS_OK;
  }.bind(this);

  document.addEventListener(CMD_TYPE.app_disconnect,
                            this.reset);
  document.addEventListener(CMD_TYPE.picture_getOld,
                            this.getPicturesInfo);
  document.addEventListener(CMD_TYPE.picture_getChanged,
                            this.getChangedPicturesInfo);
  document.addEventListener(CMD_TYPE.picture_delete,
                            this.deletePicture);
};

PictureHandler.prototype.reset = function() {
  this.enableListening = false;
};

PictureHandler.prototype.getPicturesInfo = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.picture_getOld,
    datalength: 0
  };
  switch (this.photoDBStatus) {
    case RS_OK:
      this.sendScanResult(cmd);
      break;
    case RS_ERROR.PICTURE_INIT:
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.PICTURE_INIT));
      break;
    default:
      break;
  }
};

PictureHandler.prototype.sendScanResult = function(cmd) {
  var picturesCount = 0;
  this.picturesEnumerateDone = false;
  this.picturesIndex = 0;
  this.enableListening = true;
  var handle = this.photoDB.enumerate('date', null, 'prev', function(photo) {
    if (!enableListening) {
      this.photoDB.cancelEnumeration(handle);
      return;
    }

    if (!photo) {
      this.picturesEnumerateDone = true;
      this.app.serverManager.send(cmd, int2Array(RS_OK));
      return;
    }
    if (photo.metadata.video) {
      return;
    }

    picturesCount++;
    this.sendPicture(false, cmd, photo);
  }.bind(this));
};

PictureHandler.prototype.sendPicture = function(isListen, cmd, photo) {
  var fileInfo = {
    'name': photo.name,
    'type': photo.type,
    'size': photo.size,
    'date': photo.date,
    'metadata': photo.metadata,
  };

  var imageBlob = photo.metadata.thumbnail;
  if (imageBlob == null) {
    this.picturesIndex++;
    if (isListen) {
      this.app.serverManager.update(cmd, string2Array(JSON.stringify(fileInfo)));
    } else {
      this.app.serverManager.send(cmd, string2Array(JSON.stringify(fileInfo)));
    }
    return;
  }

  var fileReader = new FileReader();
  fileReader.readAsDataURL(imageBlob);
  fileReader.onload = function(e) {
    fileInfo.metadata.thumbnail = e.target.result;
    this.picturesIndex++;
    if (isListen) {
      this.app.serverManager.update(cmd, string2Array(JSON.stringify(fileInfo)));
    } else {
      this.app.serverManager.send(cmd, string2Array(JSON.stringify(fileInfo)));
    }
  }.bind(this);
};

PictureHandler.prototype.getChangedPicturesInfo = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.picture_getChanged,
    datalength: 0
  };
  if (!this.photoDB || this.photoDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.PICTURE_INIT));
    return;
  }

  this.photoDB.onscanend = function onscanend() {
    this.app.serverManager.send(cmd, int2Array(RS_OK));
  }.bind(this);

  this.photoDB.oncreated = function(event) {
    event.detail.forEach(function(photo) {
      if (photo.metadata.video) {
        return;
      }
      this.sendPicture(true, cmd, photo);
    }.bind(this));
  }.bind(this);

  this.photoDB.ondeleted = function(event) {
    this.app.serverManager.update(cmd, string2Array(JSON.stringify(event.detail)));
  }.bind(this);
  this.photoDB.scan();
};

PictureHandler.prototype.deletePicture = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.picture_delete,
    datalength: 0
  };
  if (this.photoDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.PICTURE_INIT));
    return;
  }
  var fileName = array2String(e.data);
  this.photoDB.deleteFile(fileName);
  this.app.serverManager.send(cmd, int2Array(RS_OK));
};

exports.PictureHandler = PictureHandler;

})(window);
