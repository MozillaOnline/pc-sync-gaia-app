'use strict';

/* global ContactHandler, DeviceHandler, MusicHandler, PictureHandler,
 * VideoHandler, FileHandler */

(function(exports) {

var HandlersManager = function(app) {
  this.app = app;
  this.contactHandler = new ContactHandler(this.app);
  this.deviceHandler = new DeviceHandler(this.app);
  this.musicHandler = new MusicHandler(this.app);
  this.pictureHandler = new PictureHandler(this.app);
  this.videoHandler = new VideoHandler(this.app);
  this.fileHandler = new FileHandler(this.app);
};

HandlersManager.prototype.reset = function() {  
  var evt = new CustomEvent(CMD_TYPE.app_disconnect, {
    'detail': {
      'id': CMD_ID.app_disconnect,
      'data': null
    }
  });
  document.dispatchEvent(evt);
};

HandlersManager.prototype.handleMessage = function(cmd, data) {
  var evt = new CustomEvent(cmd.flag, {
    'detail': {
      'id': cmd.id,
      'data': data
    }
  });
  document.dispatchEvent(evt);
};

exports.HandlersManager = HandlersManager;

})(window);
