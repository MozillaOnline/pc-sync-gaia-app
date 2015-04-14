'use strict';

(function(exports) {

var FileHandler = function(app) {
  this.app = app;
  console.log("FileHandler init!");
  document.addEventListener(CMD_TYPE.file_pull, this.pull.bind(this));
  document.addEventListener(CMD_TYPE.file_push, this.push.bind(this));
  this.storages = navigator.getDeviceStorages('sdcard');
  if (this.storages) {
    return;
  }

  var storage = navigator.getDeviceStorage('sdcard');
  if (storage) {
    this.storages.push(storage);
  }
};

FileHandler.prototype.pull = function(e) {
  if (!this.storages) {
    return;
  }
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.file_pull,
    datalength: 0
  };
  var fileObj = JSON.parse(array2String(e.detail.data));

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
  console.log("FileHandler push!");
  if (!this.storages) {
    return;
  }
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.file_push,
    datalength: 0
  };
  console.log(e.detail.data.subarray(0, 4));
  var sublen = array2Int(e.detail.data.subarray(0, 4));
  console.log(sublen);
  console.log(array2String(e.detail.data.subarray(4, sublen + 4)));
  var fileObj = JSON.parse(array2String(e.detail.data.subarray(4, sublen + 4)));

  for (var i = 0; i < this.storages.length; i++) {
    if (fileObj.storageName != this.storages[i].storageName) {
      continue;
    }
    var subDataLen = e.detail.data.byteLength !== undefined ? e.detail.data.byteLength : e.detail.data.length;
    var subdata = e.detail.data.subarray(sublen + 8, subDataLen);
    console.log(subdata.byteLength);
    var file = new Blob([subdata], {type: fileObj.fileType});

    var request = this.storages[i].addNamed(file, fileObj.fileName);
    request.onsuccess = function() {
      console.log("FileHandler push success!");
      this.app.serverManager.send(cmd, int2Array(RS_OK));
    }.bind(this);

    request.onerror = function() {
      console.log("FileHandler push error!");
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.FILE_ADD));
    }.bind(this);

    return;
  }

  // File not exist.
  this.app.serverManager.send(cmd, int2Array(RS_ERROR.FILE_NOTEXIT));
};

exports.FileHandler = FileHandler;

})(window);
