'use strict';

(function(exports) {

var DeviceHandler = function(app) {
  this.app = app;
  this.started = false;
};

DeviceHandler.prototype.start = function() {
  if (this.started) {
    console.log('DeviceHandler is running.');
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

DeviceHandler.prototype.stop = function() {
  if (!this.started) {
    console.log('DeviceHandler has been stopped.');
    return;
  }

  this.started = false;
  this.storages = [];
};

DeviceHandler.prototype.handleMessage = function(cmd, data) {
  try {
    switch (cmd.command) {
      case DEVICEINFO_COMMAND.getVersion:
        this.getVersion(cmd);
        break;
      case DEVICEINFO_COMMAND.getStorage:
        this.getStorage(cmd);
        break;
      case DEVICEINFO_COMMAND.getStorageFree:
        this.getStorageFree(cmd);
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

DeviceHandler.prototype.getVersion = function(cmd) {
  var request = window.navigator.mozApps.getSelf();
  request.onsuccess = function() {
    if (request.result) {
      cmd.result = RS_OK;
      this.app.serverManager.send(cmd, request.result.manifest.version);
    } else {
      cmd.result = RS_ERROR.UNKNOWEN;
      this.app.serverManager.send(cmd, null);
    }
  }.bind(this);

  request.onerror = function() {
    cmd.result = RS_ERROR.UNKNOWEN;
    this.app.serverManager.send(cmd, null);
  }.bind(this);
};

DeviceHandler.prototype.getSpace = function(name, types, callback) {
  var storageName = name;
  var info = {};

  var req = types['sdcard'].available();
  req.onsuccess = function(evt) {
    var state = evt.target.result;
    if (state != 'available') {
      callback(storageName, info).bind(this);
      return;
    }

    var request = types['sdcard'].usedSpace();
    request.onsuccess = function (evt) {
      info['usedSpace'] = evt.target.result;

      var reqFree = types['sdcard'].freeSpace();
      reqFree.onsuccess = function (evt) {
        info['freeSpace'] = evt.target.result;

        var reqPicture = types['pictures'].usedSpace();
        reqPicture.onsuccess = function(evt) {
          info['picture'] = evt.target.result;

          var reqMusic = types['music'].usedSpace();
          reqMusic.onsuccess = function(evt) {
            info['music'] = evt.target.result;

            var reqVideos = types['videos'].usedSpace();
            reqVideos.onsuccess = function(evt) {
              info['videos'] = evt.target.result;
              callback(storageName, info);
            };

            reqVideos.onerror = function(evt) {
              callback(storageName, info);
            };
          };

          reqMusic.onerror = function(evt) {
            callback(storageName, info);
          };
        };

        reqPicture.onerror = function(evt) {
          callback(storageName, info);
        };
      };

      reqFree.onerror = function(evt) {
        callback(storageName, info);
      };
    };

    request.onerror = function(evt) {
      callback(storageName, info);
    };
  };

  req.onerror = function(evt) {
    callback(storageName, info);
  };
};

DeviceHandler.prototype.getStorage = function(cmd) {
  var mediaTypes = ['sdcard', 'pictures', 'music', 'videos'];
  var storagesInfo = {};
  var storagesType = {};
  var storagesCount = 0;

  mediaTypes.forEach(function(aType) {
    var storages = navigator.getDeviceStorages(aType);
    if (!storages) {
      var storage = navigator.getDeviceStorage(aType);
      if (storage) {
        storages.push(storage);
      }
    }

    if (!storages) {
      return;
    }

    for (var i = 0; i < storages.length; i++) {
      var name = storages[i].storageName;
      if (!(name in storagesType)) {
        storagesCount++;
        storagesType[name] = {};
      }
      if (!(name in storagesInfo)) {
        storagesInfo[name] = {};
        storagesInfo[name]['id'] = i;
      }
      storagesType[name][aType] = storages[i];
    }
  });

  if (storagesCount == 0) {
    cmd.result = RS_OK;
    var sendData = JSON.stringify(storagesInfo);
    this.app.serverManager.send(cmd, sendData);
    return;
  }

  for (var uname in storagesType) {
    this.getSpace(uname, storagesType[uname], function(rName, info) {
      storagesCount--;
      storagesInfo[rName]['info'] = info;
      if (storagesCount > 0) {
        return;
      }
      cmd.result = RS_OK;
      var sendData = JSON.stringify(storagesInfo);
      this.app.serverManager.send(cmd, sendData);
    }.bind(this));
  }
};

DeviceHandler.prototype.getFreeSpace = function(name, sdcard, callback) {
  var storageName = name;
  var freeSpace = 0;
  var req = sdcard.available();

  req.onsuccess = function(evt) {
    var state = evt.target.result;
    if (state != 'available') {
      callback(storageName, freeSpace);
      return;
    }

    var request = sdcard.freeSpace();
    request.onsuccess = function(evt) {
      freeSpace = evt.target.result;
      callback(storageName, freeSpace);
    };

    request.onerror = function(evt) {
      callback(storageName, freeSpace);
    };
  };

  req.onerror = function(evt) {
    callback(storageName, freeSpace);
  };
};

DeviceHandler.prototype.getStorageFree = function(cmd) {
  var storagesInfo = {};

  if (!this.storages) {
    cmd.result = RS_OK;
    var sendData = JSON.stringify(storagesInfo);
    this.app.serverManager.send(cmd, sendData);
    return;
  }

  for (var i = 0; i < this.storages.length; i++) {
    if (!this.storages[i].default) {
      continue;
    }
    var name = this.storages[i].storageName;
    this.getFreeSpace(name, this.storages[i], function(rName, freeSpace) {
      storagesInfo[rName] = freeSpace;
      cmd.result = RS_OK;
      var sendData = JSON.stringify(storagesInfo);
      this.app.serverManager.send(cmd, sendData);
    }.bind(this));
    break;
  }
};

exports.DeviceHandler = DeviceHandler;

})(window);
