var musicdb;
var bInited = false;
var bRename = false;
var oldName;

function initDB() {
  musicdb = new MediaDB('music', parseAudioMetadata , {
        indexes: ['metadata.album', 'metadata.artist', 'metadata.title',
                  'metadata.rated', 'metadata.played', 'date'],
        batchSize: 1,
        autoscan: false, 
        version: 2 
    });
    
  musicdb.onunavailable = function(event) {
      //get all the reasons from event
      dump("=====musicdb is unavailable");
  };
  musicdb.onready = function() {
    self.musicdb.scan();
    dump("=====musicdb is ready");
  };
  musicdb.onscanstart = function() {
    dump("=====musicdb scan start");
  };
  musicdb.onscanend = function() {
    self.bInited = true;
    dump("=====musicdb scan end");
  };
  musicdb.oncreated = function(event) {
    dump("=====music file create");
    if(self.bRename) {
      self.bRename = false;
      self.musicdb.deleteFile(self.oldName);
    }
  };
  musicdb.ondeleted = function(event) {
    dump("=====music file deleted");
  };
}

function musicHelper(jsonCmd, sendCallback, sendList, recvList) {
  if (!bInited) {
    initDB();
    var timer = setInterval(function() {
      if(bInited) {
        clearInterval(timer);
        exeRequest(jsonCmd, sendCallback, sendList, recvList);
        }
      }, 100);
  } else {
    exeRequest(jsonCmd, sendCallback, sendList, recvList);
  }
}

function  exeRequest(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "getAllMusicsInfo":
      {
        getAllMusicsInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getMusic":
      {
        getMusic(jsonCmd, sendCallback, sendList);
        break;
      }
    case "addMusic":
      {
        addMusic(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "deleteMusic":
      {
        deleteMusic(jsonCmd, sendCallback);
        break;
      }
    case "renameMusic":
      {
        renameMusic(jsonCmd, sendCallback);
        break;
      }
    default:
      {
        debug('MusicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('MusicHelper.js smsHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllMusicsInfo(jsonCmd, sendCallback, sendList) {
  try {
    musicdb.getAll(function(records) {
      var musics = records;
      var result = [];
  
      for(var i=0; i<musics.length; i++) {
        var fileInfo = {
          name:null,
          type:null,
          size:0,
          date:0
        };
        fileInfo.name = musics[i].name;
        fileInfo.type = musics[i].type;
        fileInfo.size = musics[i].size;
        fileInfo.date = musics[i].date;
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
  } catch(e) {
    debug('MusicHelper.js getAllMusicsInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getMusic(jsonCmd, sendCallback, sendList) {
  try {
    musicdb.getFile(jsonCmd.data,function(file) {
      var fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = function fileLoad(e) {
        var data = {
          action: 'response',
          id: jsonCmd.requestid,
          command: jsonCmd.requestcommand,
          status: 200,
          data: e.target.result
        }
        jsonCmd.result = RS_OK;
        var musicData = JSON.stringify(data);
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
    debug('MusicHelper.js getMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addMusic(jsonCmd, sendCallback, sendList, recvList) {
  doAdd(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data[1], jsonCmd.exdatalength);
}

function doAdd(jsonCmd, sendCallback, sendList, recvList, musicData, remainder) {
  try {
    if (remainder > 0) {
      var recvData;
      if (recvList.length > 0) {
        musicData += recvList[0];
        remainder -= recvList[0].length;
        recvList.remove(0);
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, musicData, remainder));
      } else {
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, musicData, remainder), 20);
      }
    } else {
      musicdb.addFile(jsonCmd.data[0], dataURItoBlob(musicData));
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    }
  } catch (e) {
    debug('MusicHelper.js addMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function deleteMusic(jsonCmd, sendCallback) {
  try {
    musicdb.deleteFile(jsonCmd.data);
    jsonCmd.result = RS_OK;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  } catch (e) {
    debug('MusicHelper.js deleteMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function renameMusic(jsonCmd, sendCallback) {
  try {
    var oldFile = jsconCmd.data[0];
    var newFile = jsconCmd.data[1];
    musicdb.getFile(oldFile, function(file) {
      musicdb.addFile(newFile, file);
      oldName = oldFile;
      bRename = true;
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    });
  } catch (e) {
    debug('MusicHelper.js renameMusic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}
