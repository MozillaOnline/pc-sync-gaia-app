/*------------------------------------------------------------------------------------------------------------
 *File Name: MusicHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage music files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var musicDB = null;

function musicHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "addMusic":
      {
        addMusic(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "deleteMusicByPath":
      {
        deleteMusicByPath(jsonCmd, sendCallback);
        break;
      }
    case "getAllMusicsInfo":
      {
        getAllMusicsInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getMusicByPath":
      {
        getMusicByPath(jsonCmd, sendCallback, sendList);
        break;
      }
    case "initMusic":
      {
        initMusic(jsonCmd, sendCallback);
        break;
      }
    case "renameMusic":
      {
        renameMusic(jsonCmd, sendCallback);
        break;
      }
    default:
      {
        console.log('MusicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    console.log('MusicHelper.js musicHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addMusic(jsonCmd, sendCallback, sendList, recvList) {
  doAddMusic(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data, jsonCmd.exdatalength);
}

function doAddMusic(jsonCmd, sendCallback, sendList, recvList, musicData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        musicData += recvList[0];
        remainder -= recvList[0].length;
        recvList.remove(0);
        setTimeout(function() {
          doAddMusic(jsonCmd, sendCallback, sendList, recvList, musicData, remainder);
        }, 0);
      } else {
        setTimeout(function() {
          doAddMusic(jsonCmd, sendCallback, sendList, recvList, musicData, remainder);
        }, 20);
      }
    } else {
      var jsonMusicData = JSON.parse(musicData);
      musicDB.addFile(jsonMusicData[0], dataUri2Blob(jsonMusicData[1]), function() {
        jsonCmd.result = RS_OK;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      }, function() {
        jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      });
    }
  } catch (e) {
    console.log('MusicHelper.js addMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function deleteMusicByPath(jsonCmd, sendCallback) {
  try {
    musicDB.deleteFile(jsonCmd.data);
    jsonCmd.result = RS_OK;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  } catch (e) {
    console.log('MusicHelper.js deleteMusicByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllMusicsInfo(jsonCmd, sendCallback, sendList) {
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
      if (musicsData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = musicsData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = musicsData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = musicsData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < musicsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < musicsData.length) {
            sendList.push(musicsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(musicsData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    });
  } catch (e) {
    console.log('MusicHelper.js getAllMusicsInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getMusicByPath(jsonCmd, sendCallback, sendList) {
  try {
    musicDB.getFile(jsonCmd.data, function(file) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function fileLoad(e) {
        jsonCmd.result = RS_OK;
        var musicData = JSON.stringify(e.target.result);
        if (musicData.length <= MAX_PACKAGE_SIZE) {
          jsonCmd.data = musicData;
          jsonCmd.exdatalength = 0;
          sendCallback(jsonCmd);
        } else {
          jsonCmd.data = musicData.substr(0, MAX_PACKAGE_SIZE);
          jsonCmd.exdatalength = musicData.length - MAX_PACKAGE_SIZE;
          for (var i = MAX_PACKAGE_SIZE; i < musicData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < musicData.length) {
              sendList.push(musicData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(musicData.substr(i));
            }
          }
          sendCallback(jsonCmd);
        }
      };
    });
  } catch (e) {
    console.log('MusicHelper.js getMusicByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function initMusic(jsonCmd, sendCallback) {
  try {
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
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
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
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    console.log('MusicHelper.js initDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function renameMusic(jsonCmd, sendCallback) {
  try {
    var jsonMusicData = JSON.parse(jsonCmd.data);
    var oldName = jsonMusicData[0];
    var newFile = jsonMusicData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    } else {
      musicDB.getFile(oldName, function(file) {
        musicDB.addFile(newFile, file, function() {
          console.log('MusicHelper.js deleteFile oldName: ' + oldName);
          musicDB.deleteFile(oldName);
          jsonCmd.result = RS_OK;
          jsonCmd.exdatalength = 0;
          jsonCmd.data = '';
          sendCallback(jsonCmd);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
          jsonCmd.exdatalength = 0;
          jsonCmd.data = '';
          sendCallback(jsonCmd);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.MUSIC_RENAME;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      });
    }
  } catch (e) {
    console.log('MusicHelper.js renameMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}