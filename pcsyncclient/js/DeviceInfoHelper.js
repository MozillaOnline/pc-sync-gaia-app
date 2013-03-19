/*------------------------------------------------------------------------------------------------------------
 *File Name: DeviceInfoHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage device informations, storage include 'apps','music', 'pictures','videos','sdcard'
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function deviceInfoHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "getStorage":
      {
        getStorage(jsonCmd, sendCallback);
        break;
      }
    default:
      {
        debug('DeviceInfoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('DeviceInfoHelper.js deviceInfoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getStorage(jsonCmd, sendCallback) {
  try {
    var deviceStorage = window.navigator.getDeviceStorage(jsonCmd.data);
    if (!deviceStorage) {
      jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    } else {
      var request = deviceStorage.stat();
      request.onsuccess = function(e) {
        jsonCmd.result = RS_OK;
        jsonCmd.exdatalength = 0;
        var storageData = {
          'totalBytes': e.target.result.totalBytes,
          'freeBytes': e.target.result.freeBytes
        };
        jsonCmd.data = JSON.stringify(storageData);
        sendCallback(jsonCmd);
      }
      request.onerror = function(e) {
        jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      };
    }
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
    debug('SmsHelper.js getStorage failed: ' + e);
  }
}