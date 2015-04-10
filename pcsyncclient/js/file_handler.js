'use strict';

(function(exports) {

var FileHandler = function(app) {
  this.app = app;
  this.storages = navigator.getDeviceStorages('sdcard');
  if (this.storages) {
    return;
  }

  var storage = navigator.getDeviceStorage('sdcard');
  if (storage) {
    this.storages.push(storage);
  }
  document.addEventListener(CMD_TYPE.file_pull, this.pull);
  document.addEventListener(CMD_TYPE.file_push, this.push);
};

FileHandler.prototype.pull = function(e) {
  if (!this.storages) {
    return;
  }
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.file_pull,
    datalength: 0
  };
  var fileObj = JSON.parse(array2String(e.data));

  for (var i = 0; i < this.storages.length; i++) {
    if (fileObj.storageName != this.storages[i].storageName) {
      continue;
    }

    var request = this.storages[i].get(fileObj.fileName);
    request.onsuccess = function() {
      var file = request.result;
      var fr = new FileReader();
      fr.readAsArrayBuffer(file);
      fr.onload = function(e) {
        var buffer = e.target.result;
        var uint8Array = new Uint8Array(buffer);
        this.app.serverManager.send(cmd, uint8Array);
      }.bind(this);
    }.bind(this);

    request.onerror = function() {
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.FILE_NOTEXIT));
    }.bind(this);

    return;
  }

  // File not exist.
  this.app.serverManager.send(cmd, int2Array(RS_ERROR.FILE_NOTEXIT));
};

FileHandler.prototype.push = function(e) {
  if (!this.storages) {
    return;
  }
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.file_push,
    datalength: 0
  };
  var sublen = array2Int(e.data.subarray(0, 4));
  var fileObj = JSON.parse(array2String(e.data.subarray(4, sublen)));

  for (var i = 0; i < this.storages.length; i++) {
    if (fileObj.storageName != this.storages[i].storageName) {
      continue;
    }

    var subdata = e.data.subarray(sublen + 4, cmd.datalength);
    var file = new Blob([subdata], {type: fileObj.fileType});

    var request = this.storages[i].addNamed(file, fileObj.fileName);
    request.onsuccess = function() {
      this.app.serverManager.send(cmd, int2Array(RS_OK));
    }.bind(this);

    request.onerror = function() {
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.FILE_ADD));
    }.bind(this);

    return;
  }

  // File not exist.
  this.app.serverManager.send(cmd, int2Array(RS_ERROR.FILE_NOTEXIT));
};

exports.FileHandler = FileHandler;

})(window);
