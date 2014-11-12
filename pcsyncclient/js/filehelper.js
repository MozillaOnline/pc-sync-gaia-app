/*------------------------------------------------------------------------------------------------------------
 *File Name: ContactHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage contact
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function fileHelper(jsonCmd, recvData) {
  try {
    switch (jsonCmd.command) {
    case FILE_COMMAND.filePull:
      {
        filePull(jsonCmd, recvData);
        break;
      }
    case FILE_COMMAND.filePush:
      {
        filePush(jsonCmd, recvData);
        break;
      }
    default:
      {
        debug('filehelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('filehelper.js filehelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd);
  }
}

function filePull(jsonCmd, recvData) {
  var jsonFile = JSON.parse(array2String(recvData));
  var storages = navigator.getDeviceStorages('sdcard');
  if (!storages) {
    var storage = navigator.getDeviceStorage('sdcard');
    if (storage) {
      storages.push(storage);
    }
  }
  if (!storages) {
    return;
  }
  for(var i=0; i<storages.length; i++) {
    if (jsonFile.storageName == storages[i].storageName) {
      var request = storages[i].get(jsonFile.fileName);
      request.onsuccess = function () {
        var file = this.result;
        var fileReader = new FileReader();
        fileReader.readAsArrayBuffer(file);
        fileReader.onload = function(e) {
          jsonCmd.result = RS_OK;
          if (socketWrappers[serverSocket]){
            var buffer = e.target.result;
            var uint8Array = new Uint8Array(buffer);
            socketWrappers[serverSocket].send(jsonCmd, null, uint8Array);
          }
        }
      };
      request.onerror = function () {
        jsonCmd.result = RS_ERROR.FILE_NOTEXIT;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd);
      };
      return;
    }
  }
  jsonCmd.result = RS_ERROR.FILE_NOTEXIT;
  if (socketWrappers[serverSocket])
    socketWrappers[serverSocket].send(jsonCmd);
}

function filePush(jsonCmd, recvData) {
  var jsonFile = JSON.parse(array2String(recvData.subarray(0, jsonCmd.subdatalength)));
  var storages = navigator.getDeviceStorages('sdcard');
  if (!storages) {
    var storage = navigator.getDeviceStorage('sdcard');
    if (storage) {
      storages.push(storage);
    }
  }
  if (!storages) {
    return;
  }
  for(var i=0; i<storages.length; i++) {
    if (jsonFile.storageName == storages[i].storageName) {
      var file = new Blob([recvData.subarray(jsonCmd.subdatalength, jsonCmd.datalength - jsonCmd.subdatalength)], {type: jsonFile.fileType});
      var request = storages[i].addNamed(file, jsonFile.fileName);
      request.onsuccess = function () {
        jsonCmd.result = RS_OK;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd);
      };
      request.onerror = function () {
        jsonCmd.result = RS_ERROR.FILE_ADD;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd);
      };
      return;
    }
  }
  jsonCmd.result = RS_ERROR.FILE_NOTEXIT;
  if (socketWrappers[serverSocket])
    socketWrappers[serverSocket].send(jsonCmd);
}