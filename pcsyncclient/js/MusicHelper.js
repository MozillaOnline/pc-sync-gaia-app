/*------------------------------------------------------------------------------------------------------------
 *File Name: MusicHelper.js
 *Created By: wdeng@mozilla.com
 *Description: Manage music files
 *Modified By: dxue@mozilla.com
 *Description: Format code
 *----------------------------------------------------------------------------------------------------------*/

var musicDB = null;
var isMusicCreated = false;

function musicHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case MUSIC_COMMAND.addMusic:
      {
        addMusic(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case MUSIC_COMMAND.deleteMusicByPath:
      {
        deleteMusicByPath(jsonCmd, sendCallback, recvList);
        break;
      }
    case MUSIC_COMMAND.getAllMusicsInfo:
      {
        getAllMusicsInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case MUSIC_COMMAND.getMusicByPath:
      {
        getMusicByPath(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case MUSIC_COMMAND.initMusic:
      {
        initMusic(jsonCmd, sendCallback);
        break;
      }
    case MUSIC_COMMAND.renameMusic:
      {
        renameMusic(jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('MusicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('MusicHelper.js musicHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
  jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function addMusic(jsonCmd, sendCallback, sendList, recvList) {
  var musicData = "";
  if(recvList.length > 0){
    musicData = recvList.shift();
  }
  var lastDatalen = jsonCmd.datalength - musicData.length;
  doAddMusic(jsonCmd, sendCallback, sendList, recvList, musicData, lastDatalen);
}

function doAddMusic(jsonCmd, sendCallback, sendList, recvList, musicData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        var recvData = recvList.shift();
        musicData += recvData;
        remainder -= recvData.length;
        setTimeout(function() {
          doAddMusic(jsonCmd, sendCallback, sendList, recvList, musicData, remainder);
        }, 0);
      } else {
        setTimeout(function() {
          doAddMusic(jsonCmd, sendCallback, sendList, recvList, musicData, remainder);
        }, 20);
      }
    } else {
      var fileName = musicData.substr(0, jsonCmd.firstDatalength);
      var fileData = musicData.substr(jsonCmd.firstDatalength, jsonCmd.secondDatalength);
      console.log('MusicHelper.js addMusic fileName: ' + fileName);
      console.log('MusicHelper.js addMusic fileData: ' + fileData);
      //var jsonMusicData = JSON.parse(musicData);
      musicDB.addFile(fileName, dataUri2Blob(fileData), function() {
        waitAddMusicFile(null, jsonCmd, sendCallback);
      }, function() {
        jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(jsonCmd, null);
      });
    }
  } catch (e) {
    console.log('MusicHelper.js addMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
   jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function deleteMusicByPath(jsonCmd, sendCallback, recvList) {
  try {
    musicDB.deleteFile(recvList[0]);
    jsonCmd.result = RS_OK;
    jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  } catch (e) {
    console.log('MusicHelper.js deleteMusicByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
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
      jsonCmd.firstDatalength = musicsData.length;
        jsonCmd.secondDatalength = 0;
      if (musicsData.length <= MAX_PACKAGE_SIZE) {
        sendCallback(jsonCmd, musicsData);
      } else {
        sendCallback(jsonCmd, musicsData.substr(0, MAX_PACKAGE_SIZE));
        for (var i = MAX_PACKAGE_SIZE; i < musicsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < musicsData.length) {
            sendList.push(musicsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(musicsData.substr(i));
          }
        }
      }
    });
  } catch (e) {
    console.log('MusicHelper.js getAllMusicsInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
   jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getMusicByPath(jsonCmd, sendCallback, sendList, recvList) {
  try {
    musicDB.getFile(recvList[0], function(file) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = function fileLoad(e) {
        jsonCmd.result = RS_OK;
        var musicData = JSON.stringify(e.target.result);

        jsonCmd.firstDatalength = musicData.length;
        jsonCmd.secondDatalength = 0;
        if (musicData.length <= MAX_PACKAGE_SIZE) {
          sendCallback(jsonCmd, musicData);
        } else {
          sendCallback(jsonCmd, musicData.substr(0, MAX_PACKAGE_SIZE));
          for (var i = MAX_PACKAGE_SIZE; i < musicData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < musicData.length) {
              sendList.push(musicData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(musicData.substr(i));
            }
          }
        }
      };
    });
  } catch (e) {
    console.log('MusicHelper.js getMusicByPath failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
   jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function initMusic(jsonCmd, sendCallback) {
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
        sendCallback(jsonCmd, null);
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
        sendCallback(jsonCmd, null);
      };
      musicDB.oncreated = function() {
        console.log('MusicHelper.js oncreated !!!!!!!!!!!!!!!!!!!!!!');
        self.isMusicCreated = true;
      };
    } else {
      jsonCmd.result = RS_OK;
     jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
      sendCallback(jsonCmd, null);
    }

  } catch (e) {
    console.log('MusicHelper.js initDB failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
 jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function waitAddMusicFile(oldFile, jsonCmd, sendCallback) {
  if (isMusicCreated == true) {
    isMusicCreated = false;
    if (oldFile && (oldFile != "")) {
      musicDB.deleteFile(oldFile);
    }
    jsonCmd.result = RS_OK;
 jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  } else {
    setTimeout(function() {
      waitAddMusicFile(oldFile, jsonCmd, sendCallback)
    }, 20);
  }
}


function renameMusic(jsonCmd, sendCallback, recvList) {
  try {
    var jsonMusicData = JSON.parse(recvList[0]);
    var oldName = jsonMusicData[0];
    var newFile = jsonMusicData[1];
    if (oldName == newFile) {
      jsonCmd.result = RS_OK;
  jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
      sendCallback(jsonCmd, null);
    } else {
      musicDB.getFile(oldName, function(file) {
        musicDB.addFile(newFile, file, function() {
          waitAddPictureFile(oldName, jsonCmd, sendCallback);
        }, function() {
          jsonCmd.result = RS_ERROR.MEDIADB_ADDFILE;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
          sendCallback(jsonCmd, null);
        });
      }, function(event) {
        jsonCmd.result = RS_ERROR.MUSIC_RENAME;
     jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(jsonCmd, null);
      });
    }
  } catch (e) {
    console.log('MusicHelper.js renameMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
   jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}