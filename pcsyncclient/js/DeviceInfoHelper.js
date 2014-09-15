/*------------------------------------------------------------------------------------------------------------
 *File Name: DeviceInfoHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage device informations, storage include 'apps','music', 'pictures','videos','sdcard'
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function deviceInfoHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    switch (jsonCmd.command) {
    case DEVICEINFO_COMMAND.getVersion:
      getVersion(socket, jsonCmd, sendCallback);
      break;
    case DEVICEINFO_COMMAND.getStorage:
      getStorage(socket, jsonCmd, sendCallback);
      break;
    default:
      jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
      sendCallback(socket, jsonCmd, null);
      break;
    }
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getVersion(socket, jsonCmd, sendCallback) {
  var request = window.navigator.mozApps.getSelf();
  request.onsuccess = function() {
    if (request.result) {
	  jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, request.result.manifest.version);
    } else {
      jsonCmd.result = RS_ERROR.UNKNOWEN;
      sendCallback(socket, jsonCmd, null);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  };
}

function getSpace(storage, name, type, callback) {
  var request = storage.freeSpace();
  var data = {};
  request.onsuccess = function(e) {
    var freeSpace = e.target.result;
    var requestused = storage.usedSpace();
    requestused.onsuccess = function(e) {
      var usedSpace = e.target.result;
      data['usedSpace'] = usedSpace;
      data['freeSpace'] = freeSpace;
      callback(name, type, data);
    };
    requestused.onerror = function(e) {
      data['usedSpace'] = 'undefined';
      data['freeSpace'] = freeSpace;
      callback(name, type, data);
    };
  };
  request.onerror = function(e) {
    data['usedSpace'] = 'undefined';
    data['freeSpace'] = 'undefined';
    callback(name, type, data);
  };
}

function getStorage(socket, jsonCmd, sendCallback) {
  var mediaTypes = ['music', 'pictures', 'videos', 'sdcard'];
  var deviceInfo = {};
  var storagesInfo = {};
  var totalVolumes = 0;
  mediaTypes.forEach(function(aType) {
    var storages = navigator.getDeviceStorages(aType);
    if (!storages) {
      var storage = navigator.getDeviceStorage(aType);
      if (storage) {
        storages.push(storage);
      }
    }
    if (storages && storages.length > 0) {
      storages.forEach(function(storage) {
        var name = storage.storageName;
        if (!storagesInfo.hasOwnProperty(name)) {
          storagesInfo[name] = {};
        }
        storagesInfo[name][aType] = storage;
        totalVolumes++;
      });
    }
  });
  if (totalVolumes > 0) {
    for (var uname in storagesInfo) {
      for (var utype in storagesInfo[uname]) {
        getSpace(storagesInfo[uname][utype],
                 uname,
                 utype,
                 function (cname, ctype, cdata){
                  if (!deviceInfo.hasOwnProperty(cname)) {
                    deviceInfo[cname] = {};
                  }
                  deviceInfo[cname][ctype] = cdata;
                  totalVolumes--;
                  if (totalVolumes == 0) {
                    jsonCmd.result = RS_OK;
                    var sendData = JSON.stringify(deviceInfo);
                    console.log('deviceInfoHelper.js getStorage sendData: ' + sendData);
                    sendCallback(socket, jsonCmd, sendData);
                  }
        });
      }
    }
  } else {
    jsonCmd.result = RS_OK;
    var sendData = JSON.stringify(deviceInfo);
    console.log('deviceInfoHelper.js getStorage sendData: ' + sendData);
    sendCallback(socket, jsonCmd, sendData);
  }
}