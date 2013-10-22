/*------------------------------------------------------------------------------------------------------------
 *File Name: MusicHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage music files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var musicDB = null;
var curMusicSocket = null;
var curMusicJsonCmd = null;
var curMusicSendCallback = null;

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

function getOldMusicsInfo(socket, jsonCmd, sendCallback) {
  curMusicSocket = socket;
  curMusicJsonCmd = jsonCmd;
  curMusicSendCallback = sendCallback;
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
      curMusicJsonCmd.result = RS_OK;
      curMusicSendCallback(curMusicSocket, curMusicJsonCmd, JSON.stringify(musicMessage));
    };
    musicDB.oncardremoved = function oncardremoved() {
      var musicMessage = {
        type: 'music',
        callbackID: 'oncardremoved',
        detail: null
      };
      curMusicJsonCmd.result = RS_OK;
      curMusicSendCallback(curMusicSocket, curMusicJsonCmd, JSON.stringify(musicMessage));
    };
    musicDB.onready = function() {
      getMusicsList();
    };
  } else {
    getMusicsList();
  }
}

function getChangedMusicsInfo(socket, jsonCmd, sendCallback) {
  curMusicSocket = socket;
  curMusicJsonCmd = jsonCmd;
  curMusicSendCallback = sendCallback;
  if (!musicDB) {
    curMusicJsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
    curMusicSendCallback(curMusicSocket, curMusicJsonCmd, null);
    return;
  }
  musicDB.oncreated = function(event) {
    event.detail.forEach(function(music) {
      addMusic(music);
    });
  };
  musicDB.ondeleted = function(event) {
    var musicMessage = {
      type: 'music',
      callbackID: 'ondeleted',
      detail: event.detail
    };
    curMusicJsonCmd.result = RS_MIDDLE;
    curMusicSendCallback(curMusicSocket, curMusicJsonCmd, JSON.stringify(musicMessage));
  };
  musicDB.onscanend = function onscanend() {
    multiReplyFinish(curMusicSocket, 'music', curMusicJsonCmd, curMusicSendCallback);
  };
  musicDB.scan();
}

function getMusicsList() {
  musicDB.enumerate('metadata.title', function(music) {
    if (music) {
      addMusic(music);
    } else {
      multiReplyFinish(curMusicSocket, 'music', curMusicJsonCmd, curMusicSendCallback);
    }
  });
}

function addMusic(music) {
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
  curMusicJsonCmd.result = RS_MIDDLE;
  curMusicSendCallback(curMusicSocket, curMusicJsonCmd, JSON.stringify(musicMessage));
}