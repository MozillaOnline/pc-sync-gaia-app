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
  if (!musicDB || !isReadyMusicDB) {
    jsonCmd.result = RS_ERROR.MUSIC_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  var musicCount = 0;
  musicDB.enumerate('metadata.title', function(music) {
    if (!music) {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, musicCount);
      return;
    }
    musicCount++;
    sendMusic(socket, jsonCmd, sendCallback, music);
  });
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
  jsonCmd.result = RS_MIDDLE;
  sendCallback(socket, jsonCmd, JSON.stringify(musicMessage));
}

function getChangedMusicsInfo(socket, jsonCmd, sendCallback) {
  if (!musicDB || !isReadyMusicDB) {
    jsonCmd.result = RS_ERROR.MUSIC_INIT;
    sendCallback(socket, jsonCmd, null);
    return;
  }
  musicDB.scan();
  jsonCmd.result = RS_OK;
  sendCallback(socket, jsonCmd, null);
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