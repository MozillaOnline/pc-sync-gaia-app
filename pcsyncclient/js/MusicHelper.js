/*------------------------------------------------------------------------------------------------------------
 *File Name: MusicHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage music files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var musicDB = null;
var isMusicCreated = false;

function musicHelper(socket, jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case MUSIC_COMMAND.deleteMusicByPath:
      {
        deleteMusicByPath(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    case MUSIC_COMMAND.getAllMusicsInfo:
      {
        getAllMusicsInfo(socket, jsonCmd, sendCallback);
        break;
      }
    case MUSIC_COMMAND.initMusic:
      {
        initMusic(socket, jsonCmd, sendCallback);
        break;
      }
    case MUSIC_COMMAND.renameMusic:
      {
        renameMusic(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('MusicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
        break;
      }
    }
  } catch (e) {
    console.log('MusicHelper.js musicHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function deleteMusicByPath(socket, jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    musicDB.deleteFile(fileName);
    jsonCmd.result = RS_OK;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  } catch (e) {
    console.log('MusicHelper.js deleteMusicByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getAllMusicsInfo(socket, jsonCmd, sendCallback) {
  try {
    musicDB.getAll(function(records) {
      var musics = records;
      var result = [];
      for (var i = 0; i < musics.length; i++) {
        var fileInfo = {
          'name': musics[i].name,
          'type': musics[i].type,
          'size': musics[i].size,
          'date': musics[i].date
        };
        result.push(fileInfo);
      }
      jsonCmd.result = RS_OK;
      var musicsData = JSON.stringify(result);
      jsonCmd.firstDatalength = musicsData.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, musicsData, null);
    });
  } catch (e) {
    console.log('MusicHelper.js getAllMusicsInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function initMusic(socket, jsonCmd, sendCallback) {
  try {
    if (musicDB == null) {
      musicDB = new MediaDB('music', parseAudioMetadata, {
        indexes: ['metadata.album', 'metadata.artist', 'metadata.title', 'metadata.rated', 'metadata.played', 'date'],
        batchSize: 1,
        autoscan: false,
        version: 2
      });
      musicDB.onunavailable = function(event) {
        //get all the reasons from event
        console.log('MusicHelper.js musicDB is unavailable');
        jsonCmd.result = RS_ERROR.DEVICESTORAGE_UNAVAILABLE;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      };
      musicDB.onready = function() {
        self.musicDB.scan();
        console.log('MusicHelper.js musicDB is ready');
      };
      musicDB.onscanstart = function() {
        console.log('MusicHelper.js musicDB scan start');
      };
      musicDB.onscanend = function() {
        console.log('MusicHelper.js musicDB scan end');
        jsonCmd.result = RS_OK;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      };
      musicDB.oncreated = function() {
        console.log('MusicHelper.js oncreated !!!!!!!!!!!!!!!!!!!!!!');
        self.isMusicCreated = true;
      };
    } else {
      musicDB.scan();
    }

  } catch (e) {
    console.log('MusicHelper.js initDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function waitAddMusicFile(socket, oldFile, jsonCmd, sendCallback) {
  if (isMusicCreated == true) {
    isMusicCreated = false;
    if (oldFile && (oldFile != "")) {
      musicDB.deleteFile(oldFile);
    }
    jsonCmd.result = RS_OK;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  } else {
    setTimeout(function() {
      waitAddMusicFile(socket,oldFile, jsonCmd, sendCallback)
    }, 20);
  }
}


function renameMusic(socket, jsonCmd, sendCallback, recvList) {
  try {
    var fileName = recvList.shift();
    var jsonMusicData = JSON.parse(fileName);
    var oldName = jsonMusicData[0];
    var newFile = jsonMusicData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    } else {
      musicDB.getFile(oldName, function(file) {
        musicDB.addFile(newFile, file, function() {
          waitAddMusicFile(socket,oldName, jsonCmd, sendCallback);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, null, null);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.MUSIC_RENAME;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      });
    }
  } catch (e) {
    console.log('MusicHelper.js renameMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}