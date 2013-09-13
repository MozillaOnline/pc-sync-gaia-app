/*------------------------------------------------------------------------------------------------------------
 *File Name: MusicHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage music files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var musicDB = null;

function musicHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    switch (jsonCmd.command) {
    case MUSIC_COMMAND.getOldMusicsInfo:
      {
        getOldMusicsInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case MUSIC_COMMAND.getChangedMusicsInfo:
      {
        getChangedMusicsInfo(socket, jsonCmd, sendCallback);
        break;
      }
    default:
      {
        console.log('MusicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('MusicHelper.js musicHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getMusicsList(socket, jsonCmd, sendCallback) {
  musicDB.enumerate('metadata.title', function(music) {
    if (music) {
      var fileInfo = {
        'name': music.name,
        'type': music.type,
        'size': music.size,
        'date': music.date,
        'metadata': music.metadata
      };
      var musicMessage = {
        type: 'music',
        callbackID: 'enumerate',
        detail: fileInfo
      };
      jsonCmd.result = RS_MIDDLE;
      var musicData = JSON.stringify(musicMessage);
      sendCallback(socket, jsonCmd, musicData);
    } else {
      done();
    }
  });

  function done() {
    var musicMessage = {
      type: 'music',
      callbackID: 'enumerate-done',
      detail: null
    };
    jsonCmd.result = RS_OK;
    var musicData = JSON.stringify(musicMessage);
    sendCallback(socket, jsonCmd, musicData);
  }
}

function getOldMusicsInfo(socket, jsonCmd, sendCallback) {
  try {
    var selfSocket = socket;
    var selfJsonCmd = jsonCmd;
    var selfSendCallback = sendCallback;
    if (musicDB == null) {
      musicDB = new MediaDB('music', parseAudioMetadata, {
        indexes: ['metadata.album', 'metadata.artist', 'metadata.title', 'metadata.rated', 'metadata.played', 'date'],
        batchSize: 1,
        autoscan: false,
        version: 2
      });
      musicDB.onunavailable = function(event) {
        //get all the reasons from event
        var musicMessage = {
          type: 'music',
          callbackID: 'onunavailable',
          detail: event.detail
        };
        selfJsonCmd.result = RS_OK;
        var sendData = JSON.stringify(musicMessage);
        selfSendCallback(selfSocket, selfJsonCmd, sendData);
      };
      musicDB.oncardremoved = function oncardremoved() {
        var musicMessage = {
          type: 'music',
          callbackID: 'oncardremoved',
          detail: null
        };
        selfJsonCmd.result = RS_OK;
        var sendData = JSON.stringify(musicMessage);
        selfSendCallback(selfSocket, selfJsonCmd, sendData);
      };
      musicDB.onready = function() {
        getMusicsList(selfSocket, selfJsonCmd, selfSendCallback);
      };
    } else {
      getMusicsList(selfSocket, selfJsonCmd, selfSendCallback);
    }
  } catch (e) {
    console.log('MusicHelper.js initDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getChangedMusicsInfo(socket, jsonCmd, sendCallback) {
  if (!musicDB) {
    jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  var selfSocket = socket;
  var selfJsonCmd = jsonCmd;
  var selfSendCallback = sendCallback;
  musicDB.oncreated = function(event) {
    event.detail.forEach(function(music) {
      var fileInfo = {
        'name': music.name,
        'type': music.type,
        'size': music.size,
        'date': music.date,
        'metadata': music.metadata
      };
      var musicMessage = {
        type: 'music',
        callbackID: 'oncreated',
        detail: fileInfo
      };
      selfJsonCmd.result = RS_MIDDLE;
      var sendData = JSON.stringify(musicMessage);
      selfSendCallback(selfSocket, selfJsonCmd, sendData);
    });
  };
  musicDB.ondeleted = function(event) {
    var musicMessage = {
      type: 'music',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    selfJsonCmd.result = RS_MIDDLE;
    var sendData = JSON.stringify(musicMessage);
    selfSendCallback(selfSocket, selfJsonCmd, sendData);
  };
  musicDB.onscanend = function onscanend() {
    var musicMessage = {
      type: 'music',
      callbackID: 'onscanend',
      detail: null
    };
    selfJsonCmd.result = RS_OK;
    var sendData = JSON.stringify(musicMessage);
    selfSendCallback(selfSocket, selfJsonCmd, sendData);
  };
  musicDB.scan();
}