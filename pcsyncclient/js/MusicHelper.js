/*------------------------------------------------------------------------------------------------------------
 *File Name: MusicHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage music files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

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
    case MUSIC_COMMAND.deleteMusic:
      {
        deleteMusic(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    default:
      {
        debug('MusicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('MusicHelper.js musicHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getOldMusicsInfo(socket, jsonCmd, sendCallback) {
  if (!musicDB) {
    isReadyMusicDB = false;
    musicDB = new MediaDB('music', parseAudioMetadata, {
      indexes: ['metadata.album', 'metadata.artist', 'metadata.title', 'metadata.rated', 'metadata.played', 'date'],
      batchSize: 1,
      autoscan: false,
      version: 2
    });
     musicDB.onunavailable = function(event) {
      isReadyMusicDB = false;
    };
    musicDB.oncardremoved = function oncardremoved() {
      isReadyMusicDB = false;
    };
    musicDB.onready = function() {
      isReadyMusicDB = true;
      musicScan();
    }
  } else if (isReadyMusicDB) {
    musicScan();
  }

  function musicScan() {
    var musicsCount = 0;
    musicDB.enumerate('metadata.title', function(music) {
      if (!isReadyMusicDB) {
        return;
      }
      if (!music) {
        var musicMessage = {
          type: 'music',
          callbackID: 'enumerate-done',
          detail: musicsCount
        };
        jsonCmd.result = RS_OK;
        sendCallback(socket, jsonCmd, JSON.stringify(musicMessage));
        return;
      }
      musicsCount++;
      jsonCmd.result = RS_MIDDLE;
      sendMusic(socket, jsonCmd, sendCallback, music);
    });
  };
}

function getChangedMusicsInfo(socket, jsonCmd, sendCallback) {
  if (!musicDB || !isReadyMusicDB) {
    jsonCmd.result = RS_ERROR.MUSIC_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  musicDB.onscanend = function onscanend() {
    jsonCmd.result = RS_OK;
    sendCallback(socket, jsonCmd, null);
  };
  musicDB.oncreated = function(event) {
    if (!listenSocket || !listenJsonCmd || !listenSendCallback) {
      return;
    }
    event.detail.forEach(function(music) {
      listenJsonCmd.result = RS_OK;
      sendMusic(listenSocket, listenJsonCmd, listenSendCallback, music);
    });
  };
  musicDB.ondeleted = function(event) {
    if (!listenSocket || !listenJsonCmd || !listenSendCallback) {
      return;
    }
    var musicMessage = {
      type: 'music',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    listenJsonCmd.result = RS_OK;
    listenSendCallback(listenSocket, listenJsonCmd, JSON.stringify(musicMessage));
  };
  musicDB.scan();

}

function deleteMusic(socket, jsonCmd, sendCallback, recvData) {
  if (!isReadyMusicDB) {
    jsonCmd.result = RS_ERROR.MUSIC_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  var fileName = recvData;
  musicDB.deleteFile(fileName);
  jsonCmd.result = RS_OK;
  sendCallback(socket, jsonCmd, null);
}

function sendMusic(socket, jsonCmd, sendCallback, music) {
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
  sendCallback(socket, jsonCmd, JSON.stringify(musicMessage));
}