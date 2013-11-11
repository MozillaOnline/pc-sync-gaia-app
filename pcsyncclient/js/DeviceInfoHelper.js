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
    case DEVICEINFO_COMMAND.getStorage:
      {
        getStorage(socket, jsonCmd, sendCallback);
        break;
      }
    case DEVICEINFO_COMMAND.getSettings:
      {
        getSettings(socket, jsonCmd, sendCallback);
        break;
      }
    default:
      {
        debug('DeviceInfoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('DeviceInfoHelper.js deviceInfoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getStorage(socket, jsonCmd, sendCallback) {
  var mediaTypes = ['pictures', 'music', 'videos', 'sdcard', 'apps'];
  var remainingMediaTypes = mediaTypes.length;
  var deviceInfo = {};
  mediaTypes.forEach(function(aType) {
    debug('DeviceInfoHelper.js aType: ' + aType);
    var storage = window.navigator.getDeviceStorage(aType);
    if (!storage) {
      var storageData = {
        'storageName': aType,
        'usedSpace': 'undefined',
        'freeSpace': 'undefined'
      };
      deviceInfo[aType] = storageData;
      remainingMediaTypes--;
      if (remainingMediaTypes == 0) {
        jsonCmd.result = RS_OK;
        var sendData = JSON.stringify(deviceInfo);
        debug('deviceInfoHelper.js getStorage sendData: ' + sendData);
        sendCallback(socket, jsonCmd, sendData);
      }
      return;
    }
    var request = storage.freeSpace();
    request.onsuccess = function(e) {
      var freeSpace = e.target.result;
      var requestused = storage.usedSpace();
      requestused.onsuccess = function(e) {
        var usedSpace = e.target.result;
        var storageData = {
          'storageName': aType,
          'usedSpace': usedSpace,
          'freeSpace': freeSpace
        };
        debug('deviceInfoHelper.js getStorage storageData: ' + JSON.stringify(storageData));
        deviceInfo[aType] = storageData;
        remainingMediaTypes--;
        if (remainingMediaTypes == 0) {
          jsonCmd.result = RS_OK;
          var sendData = JSON.stringify(deviceInfo);
          debug('deviceInfoHelper.js getStorage sendData: ' + sendData);
          sendCallback(socket, jsonCmd, sendData);
        }
      };
      requestused.onerror = function(e) {
        var storageData = {
          'storageName': aType,
          'usedSpace': 'undefined',
          'freeSpace': freeSpace
        };
        deviceInfo[aType] = storageData;
        remainingMediaTypes--;
        if (remainingMediaTypes == 0) {
          jsonCmd.result = RS_OK;
          var sendData = JSON.stringify(deviceInfo);
          debug('deviceInfoHelper.js getStorage sendData: ' + sendData);
          sendCallback(socket, jsonCmd, sendData);
        }
      };
    };
    request.onerror = function(e) {
      var storageData = {
        'storageName': name,
        'usedSpace': 'undefined',
        'freeSpace': 'undefined'
      };
      deviceInfo[name] = storageData;
      remainingMediaTypes--;
      if (remainingMediaTypes != 0) {
        return;
      }
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(deviceInfo);
      debug('deviceInfoHelper.js getStorage sendData: ' + sendData);
      sendCallback(socket, jsonCmd, sendData);
    };
  });
}

function getSettings(socket, jsonCmd, sendCallback) {
  var key = '*';
  var request = navigator.mozSettings.createLock().get(key);
  request.onsuccess = function successGetCurrentSound() {
    debug('success get current settings: ' + request.result);
    jsonCmd.result = RS_OK;
    var sendData = JSON.stringify(request.result);
    debug('deviceInfoHelper.js getSettings sendData: ' + sendData.length);
    sendCallback(socket, jsonCmd, sendData);
  };
  request.onerror = function errorGetCurrentSound() {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  };
}