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
        console.log('DeviceInfoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('DeviceInfoHelper.js deviceInfoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getStorage(socket, jsonCmd, sendCallback) {
  try {
    var mediaTypes = ['pictures', 'music', 'videos', 'sdcard', 'apps'];
    var remainingMediaTypes = mediaTypes.length;
    var deviceInfo = {};
    mediaTypes.forEach(function(aType) {
      console.log('DeviceInfoHelper.js aType: ' + aType);
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
          console.log('deviceInfoHelper.js getStorage sendData: ' + sendData);
          sendCallback(socket, jsonCmd, sendData);
        }
      } else {
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
            console.log('deviceInfoHelper.js getStorage storageData: ' + JSON.stringify(storageData));
            deviceInfo[aType] = storageData;
            remainingMediaTypes--;
            if (remainingMediaTypes == 0) {
              jsonCmd.result = RS_OK;
              var sendData = JSON.stringify(deviceInfo);
              console.log('deviceInfoHelper.js getStorage sendData: ' + sendData);
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
              console.log('deviceInfoHelper.js getStorage sendData: ' + sendData);
              sendCallback(socket, jsonCmd, sendData);
            }
          };
        }
        request.onerror = function(e) {
          var storageData = {
            'storageName': name,
            'usedSpace': 'undefined',
            'freeSpace': 'undefined'
          };
          deviceInfo[name] = storageData;
          remainingMediaTypes--;
          if (remainingMediaTypes == 0) {
            jsonCmd.result = RS_OK;
            var sendData = JSON.stringify(deviceInfo);
            console.log('deviceInfoHelper.js getStorage sendData: ' + sendData);
            sendCallback(socket, jsonCmd, sendData);
          }
        };
      }
    });
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getSettings(socket, jsonCmd, sendCallback) {
  try {
    var key = '*';
    var request = navigator.mozSettings.createLock().get(key);
    request.onsuccess = function successGetCurrentSound() {
      console.log('success get current settings: ' + request.result);
      jsonCmd.result = RS_OK;
      var sendData = JSON.stringify(request.result);
      console.log('deviceInfoHelper.js getSettings sendData: ' + sendData.length);
      sendCallback(socket, jsonCmd, sendData);
    };
    request.onerror = function errorGetCurrentSound() {
      jsonCmd.result = RS_ERROR.UNKNOWEN;
      sendCallback(socket, jsonCmd, null);
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}