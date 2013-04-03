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
    case DEVICEINFO_COMMAND.getStorage:
      {
        getStorage(jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('DeviceInfoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('DeviceInfoHelper.js deviceInfoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getStorage(jsonCmd, sendCallback, recvList) {
  try {
    var deviceStorage = window.navigator.getDeviceStorage(recvList[0]);
    if (!deviceStorage) {
      jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    } else {
      var request = deviceStorage.freeSpace();
      request.onsuccess = function(e) {
        var freeSpace = e.target.result;
        console.log('DeviceInfoHelper.js freeSpace: ' + freeSpace);
        var requestused = deviceStorage.usedSpace();
        requestused.onsuccess = function(e) {
          var usedSpace = e.target.result;
          jsonCmd.result = RS_OK;
          var storageData = {
            'usedSpace': usedSpace,
            'freeSpace': freeSpace
          };
          var sendData = JSON.stringify(storageData);
          jsonCmd.smallDatalength = sendData.length;
          jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, sendData);
        };
        requestused.onerror = function(e) {
          jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
          jsonCmd.smallDatalength = 0;
          jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, null);
        };
      }
      request.onerror = function(e) {
        jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      };
    }
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
    console.log('SmsHelper.js getStorage failed: ' + e);
  }
}