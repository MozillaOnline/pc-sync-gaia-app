/*------------------------------------------------------------------------------------------------------------
 *File Name: MusicHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage music files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

function musicHelper(jsonCmd, recvData) {
  try {
    switch (jsonCmd.command) {
    case MUSIC_COMMAND.getOldMusicsInfo:
      {
        getOldMusicsInfo(jsonCmd);
        break;
      }
    case MUSIC_COMMAND.getChangedMusicsInfo:
      {
        getChangedMusicsInfo(jsonCmd);
        break;
      }
    case MUSIC_COMMAND.deleteMusic:
      {
        deleteMusic(jsonCmd, recvData);
        break;
      }
    default:
      {
        debug('MusicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('MusicHelper.js musicHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  }
}

function getOldMusicsInfo(jsonCmd) {
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
      jsonCmd.result = RS_ERROR.MUSIC_INIT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    };
    musicDB.oncardremoved = function oncardremoved() {
      isReadyMusicDB = false;
      jsonCmd.result = RS_ERROR.MUSIC_INIT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
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
    var handle = musicDB.enumerate('metadata.title', function(music) {
      if ( currentRegion == 'unconnect-region') {
        musicDB.cancelEnumeration(handle);
        return;
      }
      if (!music) {
        var musicMessage = {
          type: 'music',
          callbackID: 'enumerate-done',
          detail: musicsCount
        };
        jsonCmd.result = RS_OK;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, JSON.stringify(musicMessage));
        return;
      }
      musicsCount++;
      jsonCmd.result = RS_MIDDLE;
      sendMusic(false, jsonCmd, music);
    });
  };
}

function getChangedMusicsInfo(jsonCmd) {
  if (!musicDB || !isReadyMusicDB) {
    jsonCmd.result = RS_ERROR.MUSIC_INIT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
    return;
  }
  musicDB.onscanend = function onscanend() {
    jsonCmd.result = RS_OK;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
  musicDB.oncreated = function(event) {
    if (!socketWrappers[listenSocket])
      return;
    event.detail.forEach(function(music) {
      sendMusic(true, null, music);
    });
  };
  musicDB.ondeleted = function(event) {
    if (!socketWrappers[listenSocket])
      return;
    var musicMessage = {
      type: 'music',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    var listenJsonCmd = {
      id: 0,
      type: CMD_TYPE.listen,
      command: LISTEN_COMMAND.listenMusic,
      result: RS_OK,
      datalength: 0
    };
    socketWrappers[listenSocket].send(listenJsonCmd, JSON.stringify(musicMessage));
  };
  musicDB.scan();

}

function deleteMusic(jsonCmd, recvData) {
  if (!isReadyMusicDB) {
    jsonCmd.result = RS_ERROR.MUSIC_INIT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
    return;
  }
  var fileName = recvData;
  musicDB.deleteFile(fileName);
  jsonCmd.result = RS_OK;
  if (socketWrappers[serverSocket])
    socketWrappers[serverSocket].send(jsonCmd, null);
}

function sendMusic(isListen, jsonCmd, music) {
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
  if (isListen) {
    if (!socketWrappers[listenSocket])
      return;
    var listenJsonCmd = {
      id: 0,
      type: CMD_TYPE.listen,
      command: LISTEN_COMMAND.listenMusic,
      result: RS_OK,
      datalength: 0
    };
    socketWrappers[listenSocket].send(listenJsonCmd, JSON.stringify(musicMessage));
  } else {
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, JSON.stringify(musicMessage));
  }
}