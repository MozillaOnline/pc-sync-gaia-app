'use strict';

(function(exports) {

var MusicHandler = function(app) {
  this.app = app;
  console.log("MusicHandler init!");
  this.musicDBStatus = null;
  this.cachedCmd = null;
  this.enableListening = false;

  this.musicDB = new MediaDB('music', parseAudioMetadata, {
    indexes: ['metadata.album', 'metadata.artist', 'metadata.title',
              'metadata.rated', 'metadata.played', 'date'],
    batchSize: 1,
    autoscan: false,
    version: 2
  });

  this.musicDB.onunavailable = function(event) {
    this.musicDBStatus = RS_ERROR.MUSIC_INIT;
  }.bind(this);

  this.musicDB.oncardremoved = function oncardremoved() {
    this.musicDBStatus = RS_ERROR.MUSIC_INIT;
  }.bind(this);

  this.musicDB.onready = function() {
    this.musicDBStatus = RS_OK;
  }.bind(this);
  document.addEventListener(CMD_TYPE.app_disconnect,
                            this.reset.bind(this));
  document.addEventListener(CMD_TYPE.music_getOld,
                            this.getMusicsInfo.bind(this));
  document.addEventListener(CMD_TYPE.music_getChanged,
                            this.getChangedMusicsInfo.bind(this));
  document.addEventListener(CMD_TYPE.music_delete,
                            this.deleteMusic.bind(this));
};

MusicHandler.prototype.reset = function() {
  this.enableListening = false;
};

MusicHandler.prototype.getMusicsInfo = function(e) {
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.music_getOld,
    datalength: 0
  };
  switch (this.musicDBStatus) {
    case RS_OK:
      this.sendScanResult(cmd);
      break;
    case RS_ERROR.MUSIC_INIT:
    default:
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.MUSIC_INIT));
      break;
  }
};

MusicHandler.prototype.sendScanResult = function(cmd) {
  var musicsCount = 0;
  this.enableListening = true;
  var handle = this.musicDB.enumerate('metadata.title', function(music) {
    if (!this.enableListening) {
      this.musicDB.cancelEnumeration(handle);
      return;
    }

    if (!music) {
      this.app.serverManager.send(cmd, int2Array(RS_OK));
      return;
    }

    musicsCount++;
    this.sendMusic(false, cmd, music);
  }.bind(this));
};

MusicHandler.prototype.getChangedMusicsInfo = function(e) {
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.music_getChanged,
    datalength: 0
  };
  console.log("MusicHandler getChangedMusicsInfo!");
  if (!this.musicDB || this.musicDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.MUSIC_INIT));
    return;
  }

  this.musicDB.onscanend = function() {
    cmd.flag = RS_OK;
    this.app.serverManager.send(cmd, int2Array(RS_OK));
  }.bind(this);

  this.musicDB.oncreated = function(event) {
    console.log("MusicHandler getChangedMusicsInfo oncreated!");
    var responseCmd = {
      id: CMD_ID.listen_music_create,
      flag: CMD_TYPE.music_getChanged,
      datalength: 0
    };
    event.detail.forEach(function(music) {
      this.sendMusic(true, responseCmd, music);
    }.bind(this));
  }.bind(this);

  this.musicDB.ondeleted = function(event) {
    console.log("MusicHandler getChangedMusicsInfo ondeleted!");
    var responseCmd = {
      id: CMD_ID.listen_music_delete,
      flag: CMD_TYPE.music_delete,
      datalength: 0
    };
    this.app.serverManager.update(responseCmd, string2Array(JSON.stringify(event.detail)));
  }.bind(this);
  console.log("MusicHandler getChangedMusicsInfo scan!");
  this.musicDB.scan();
};

MusicHandler.prototype.deleteMusic = function(e) {
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.music_delete,
    datalength: 0
  };
  console.log("MusicHandler deleteMusic!");
  if (this.musicDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.MUSIC_INIT));
    return;
  }
  console.log("MusicHandler deleteMusic success!");
  var fileName = array2String(e.detail.data);
  this.musicDB.deleteFile(fileName);
  this.app.serverManager.send(cmd, int2Array(RS_OK));
};

MusicHandler.prototype.sendMusic = function(isListen, cmd, music) {
  var fileInfo = {
    'name': music.name,
    'type': music.type,
    'size': music.size,
    'date': music.date,
    'metadata': music.metadata
  };

  if (!isListen) {
    this.app.serverManager.send(cmd, string2Array(JSON.stringify(fileInfo)));
    return;
  }
  console.log("MusicHandler getChangedMusicsInfo update!");
  this.app.serverManager.update(cmd, string2Array(JSON.stringify(fileInfo)));
};

exports.MusicHandler = MusicHandler;
})(window);
