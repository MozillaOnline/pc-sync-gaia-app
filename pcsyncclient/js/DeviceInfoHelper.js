/*------------------------------------------------------------------------------------------------------------
 *File Name: DeviceInfoHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage device informations, storage include 'apps','music', 'pictures','videos','sdcard'
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function deviceInfoHelper(socket,jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case DEVICEINFO_COMMAND.getStorage:
      {
        getStorage(socket,jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('DeviceInfoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
        break;
      }
    }
  } catch (e) {
    console.log('DeviceInfoHelper.js deviceInfoHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}

function getStorage(socket, jsonCmd, sendCallback, recvList) {
  try {
    var storageName = recvList.shift();
    var deviceStorage = window.navigator.getDeviceStorage(storageName);
    if (!deviceStorage) {
      jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket,jsonCmd, null,null);
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
          jsonCmd.firstDatalength = sendData.length;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket,jsonCmd, sendData,null);
        };
        requestused.onerror = function(e) {
          jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket,jsonCmd, null,null);
        };
      }
      request.onerror = function(e) {
        jsonCmd.result = RS_ERROR.DEVICEINFO_GETSTORAGE;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
      };
    }
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
    console.log('SmsHelper.js getStorage failed: ' + e);
  }
}