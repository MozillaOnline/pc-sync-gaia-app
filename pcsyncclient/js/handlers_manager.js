'use strict';

/* global ContactHandler, DeviceHandler, MusicHandler, PictureHandler,
 * VideoHandler, FileHandler */

(function(exports) {

var HandlersManager = function(app) {
  this.app = app;
  this.started = false;
};

HandlersManager.prototype.start = function() {
  if (this.started) {
    console.log('HandlersManager is running.');
    return;
  }

  this.started = true;

  this.contactHandler = new ContactHandler(this.app);
  this.contactHandler.start();

  this.deviceHandler = new DeviceHandler(this.app);
  this.deviceHandler.start();

  this.musicHandler = new MusicHandler(this.app);
  this.musicHandler.start();

  this.pictureHandler = new PictureHandler(this.app);
  this.pictureHandler.start();

  this.videoHandler = new VideoHandler(this.app);
  this.videoHandler.start();

  this.fileHandler = new FileHandler(this.app);
  this.fileHandler.start();
};

HandlersManager.prototype.stop = function() {
  if (!this.started) {
    console.log('HandlersManager has been stopped.');
    return;
  }

  this.started = false;

  if (this.contactHandler) {
    this.contactHandler.stop();
    this.contactHandler = null;
  }

  if (this.deviceHandler) {
    this.deviceHandler.stop();
    this.deviceHandler = null;
  }

  if (this.musicHandler) {
    this.musicHandler.stop();
    this.musicHandler = null;
  }

  if (this.pictureHandler) {
    this.pictureHandler.stop();
    this.pictureHandler = null;
  }

  if (this.videoHandler) {
    this.videoHandler.stop();
    this.videoHandler = null;
  }

  if (this.fileHandler) {
    this.fileHandler.stop();
    this.fileHandler = null;
  }
};

HandlersManager.prototype.handleMessage = function(cmd, data) {
  switch (cmd.type) {
    case CMD_TYPE.contact:
      this.contactHandler.handleMessage(cmd, data);
      break;
    case CMD_TYPE.deviceInfo:
      this.deviceHandler.handleMessage(cmd, data);
      break;
    case CMD_TYPE.music:
      this.musicHandler.handleMessage(cmd, data);
      break;
    case CMD_TYPE.picture:
      this.pictureHandler.handleMessage(cmd, data);
      break;
    case CMD_TYPE.video:
      this.videoHandler.handleMessage(cmd, data);
      break;
    case CMD_TYPE.file:
      this.fileHandler.handleMessage(cmd, data);
      break;
    default:
      cmd.result = RS_ERROR.TYPE_UNDEFINED;
      if (this.app.serverManager.dataSocketWrapper) {
        this.app.serverManager.dataSocketWrapper.send(cmd, null);
      }
      break;
  }
};

exports.HandlersManager = HandlersManager;

})(window);
