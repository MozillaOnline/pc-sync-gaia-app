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
          socketWrappers[serverSocket].send(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('ContactHelper.js contactHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  }
}

function filePull(jsonCmd, recvData) {
  var jsonFile = JSON.parse(recvData);
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
        fileReader.readAsBinaryString(file);
        fileReader.onload = function(e) {
          var data = e.target.result;
          jsonCmd.result = RS_OK;
          if (socketWrappers[serverSocket])
            socketWrappers[serverSocket].send(jsonCmd, data);
        }
      };
      request.onerror = function () {
        jsonCmd.result = RS_ERROR.FILE_NOTEXIT;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, null);
      };
      return;
    }
  }
  jsonCmd.result = RS_ERROR.FILE_NOTEXIT;
  if (socketWrappers[serverSocket])
    socketWrappers[serverSocket].send(jsonCmd, null);
}

function filePush(jsonCmd, recvData) {
  var jsonFile = JSON.parse(recvData);
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
      var dataBuffer = new ArrayBuffer(jsonFile.data.length);
      var dataArray = new Uint8Array(dataBuffer);
      for (var j = 0; j < jsonFile.data.length; j++) {
        dataArray[j] = jsonFile.data.charCodeAt(j);
      }
      var file = new Blob([dataBuffer], {type: jsonFile.fileType});
      var request = storages[i].addNamed(file, jsonFile.fileName);
      request.onsuccess = function () {
        jsonCmd.result = RS_OK;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, null);
      };
      request.onerror = function () {
        jsonCmd.result = RS_ERROR.FILE_ADD;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, null);
      };
      return;
    }
  }
  jsonCmd.result = RS_ERROR.FILE_NOTEXIT;
  if (socketWrappers[serverSocket])
    socketWrappers[serverSocket].send(jsonCmd, null);
}