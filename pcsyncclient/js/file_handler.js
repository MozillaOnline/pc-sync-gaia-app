'use strict';

(function(exports) {

var FileHandler = function(app) {
  this.app = app;
  this.started = false;
};

FileHandler.prototype.start = function() {
  if (this.started) {
    console.log('FileHandler is running.');
    return;
  }

  this.started = true;

  this.storages = navigator.getDeviceStorages('sdcard');
  if (this.storages) {
    return;
  }

  var storage = navigator.getDeviceStorage('sdcard');
  if (storage) {
    this.storages.push(storage);
  }
};

FileHandler.prototype.stop = function() {
  if (!this.started) {
    console.log('FileHandler has been stopped.');
    return;
  }

  this.started = false;
  this.storages = [];
};

FileHandler.prototype.handleMessage = function(cmd, data) {
  try {
    switch (cmd.command) {
      case FILE_COMMAND.filePull:
        this.pull(cmd, data);
        break;
      case FILE_COMMAND.filePush:
        this.push(cmd, data);
        break;
      default:
        cmd.result = RS_ERROR.COMMAND_UNDEFINED;
        this.app.serverManager.send(cmd);
        break;
    }
  } catch (e) {
    cmd.result = RS_ERROR.UNKNOWEN;
    this.app.serverManager.send(cmd);
  }
};

FileHandler.prototype.pull = function(cmd, data) {
  if (!this.storages) {
    return;
  }

  var fileObj = JSON.parse(array2String(data));

  for (var i = 0; i < this.storages.length; i++) {
    if (fileObj.storageName != storages[i].storageName) {
      continue;
    }

    var request = storages[i].get(fileObj.fileName);
    request.onsuccess = function() {
      var file = this.result;
      var fr = new FileReader();
      fr.readAsArrayBuffer(file);
      fr.onload = function(e) {
        cmd.result = RS_OK;
        var buffer = e.target.result;
        var uint8Array = new Uint8Array(buffer);
        this.app.serverManager.send(cmd, null, uint8Array);
      }.bind(this);
    }.bind(this);

    request.onerror = function() {
      cmd.result = RS_ERROR.FILE_NOTEXIT;
      this.app.serverManager.send(cmd);
    }.bind(this);

    return;
  }

  // File not exist.
  cmd.result = RS_ERROR.FILE_NOTEXIT;
  this.app.serverManager.send(cmd);
};

FileHandler.prototype.push = function(cmd, data) {
  if (!this.storages) {
    return;
  }

  var fileObj = JSON.parse(array2String(data.subarray(0, cmd.subdatalength)));

  for (var i = 0; i < this.storages.length; i++) {
    if (fileObj.storageName != storages[i].storageName) {
      continue;
    }

    var subdata = data.subarray(cmd.subdatalength, cmd.datalength);
    var file = new Blob([subdata], {type: fileObj.fileType});

    var request = storages[i].addNamed(file, fileObj.fileName);
    request.onsuccess = function() {
      cmd.result = RS_OK;
      this.app.serverManager.send(cmd);
    }.bind(this);

    request.onerror = function() {
      cmd.result = RS_ERROR.FILE_ADD;
      this.app.serverManager.send(cmd);
    }.bind(this);

    return;
  }

  // File not exist.
  cmd.result = RS_ERROR.FILE_NOTEXIT;
  this.app.serverManager.send(cmd);
};

exports.FileHandler = FileHandler;

})(window);
