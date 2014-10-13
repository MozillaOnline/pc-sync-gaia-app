/*------------------------------------------------------------------------------------------------------------
 *File Name: DeviceInfoHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage device informations, storage include 'apps','music', 'pictures','videos','sdcard'
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function deviceInfoHelper(jsonCmd, recvData) {
  try {
    switch (jsonCmd.command) {
    case DEVICEINFO_COMMAND.getVersion:
      getVersion(jsonCmd);
      break;
    case DEVICEINFO_COMMAND.getStorage:
      getStorage(jsonCmd);
      break;
    default:
      jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
      break;
    }
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  }
}

function getVersion(jsonCmd) {
  var request = window.navigator.mozApps.getSelf();
  request.onsuccess = function() {
    if (request.result) {
      jsonCmd.result = RS_OK;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, request.result.manifest.version);
    } else {
      jsonCmd.result = RS_ERROR.UNKNOWEN;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}

function getSpace(name, types, callback) {
  var storageName = name;
  var info = {};
  var availreq = types['sdcard'].available();
  availreq.onsuccess = function availSuccess(evt) {
    var state = evt.target.result;
    if (state != 'available') {
      callback(storageName, info);
      return;
    }
    var reqused = types['sdcard'].usedSpace();
    reqused.onsuccess = function (evt) {
      info['usedSpace'] = evt.target.result;
      var reqfree = types['sdcard'].freeSpace();
      reqfree.onsuccess = function (evt) {
        info['freeSpace'] = evt.target.result;
        var reqpicture = types['pictures'].usedSpace();
        reqpicture.onsuccess = function (evt) {
          info['picture'] = evt.target.result;
          var reqmusic = types['music'].usedSpace();
          reqmusic.onsuccess = function (evt) {
            info['music'] = evt.target.result;
            var reqvideos = types['videos'].usedSpace();
            reqvideos.onsuccess = function (evt) {
              info['videos'] = evt.target.result;
              callback(storageName, info);
              return;
            }
            reqvideos.onerror = function (evt) {
              callback(storageName, info);
              return;
            }
          }
          reqmusic.onerror = function (evt) {
            callback(storageName, info);
            return;
          }
        }
        reqpicture.onerror = function (evt) {
          callback(storageName, info);
          return;
        }
      }
      reqfree.onerror = function (evt) {
        callback(storageName, info);
        return;
      }
    }
    reqused.onerror = function (evt) {
      callback(storageName, info);
      return;
    }
  };
  availreq.onerror = function availError(evt) {
    callback(storageName, info);
  };
}

function getStorage(jsonCmd) {
  var mediaTypes = ['sdcard', 'pictures', 'music', 'videos'];
  var storagesInfo = {};
  var storagesType = {};
  var storagesCount = 0;
  mediaTypes.forEach(function (aType) {
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
    for(var i=0; i<storages.length; i++) {
      var name = storages[i].storageName;
      if (!storagesType.hasOwnProperty(name)) {
        storagesCount ++;
        storagesType[name] = {};
      }
      if (!storagesInfo.hasOwnProperty(name)) {
        storagesInfo[name] = {};
        storagesInfo[name]['id'] = i;
      }
      storagesType[name][aType] = storages[i];
    }
  });
  if (storagesCount == 0) {
    jsonCmd.result = RS_OK;
    var sendData = JSON.stringify(storagesInfo);
    if (socketWrappers[serverSocket]) {
      socketWrappers[serverSocket].send(jsonCmd, sendData);
    }
    return;
  }
  for(var uname in storagesType) {
    getSpace(uname, storagesType[uname], function (rName, info){
      storagesCount--;
      storagesInfo[rName]['info'] = info;
      if (storagesCount > 0) {
        return;
      }
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(storagesInfo);
      if (socketWrappers[serverSocket]) {
        socketWrappers[serverSocket].send(jsonCmd, sendData);
      }
  });
  }
}