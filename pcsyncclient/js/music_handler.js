'use strict';

(function(exports) {

var MusicHandler = function(app) {
  this.app = app;
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
                            this.reset);
  document.addEventListener(CMD_TYPE.music_getOld,
                            this.getMusicsInfo);
  document.addEventListener(CMD_TYPE.music_getChanged,
                            this.getChangedMusicsInfo);
  document.addEventListener(CMD_TYPE.music_delete,
                            this.deleteMusic);
};

ContactHandler.prototype.reset = function() {
  this.enableListening = false;
};

MusicHandler.prototype.getMusicsInfo = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.music_getOld,
    datalength: 0
  };
  switch (this.musicDBStatus) {
    case RS_OK:
      this.sendScanResult(cmd);
      break;
    case RS_ERROR.MUSIC_INIT:
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.MUSIC_INIT));
      break;
    default:
      break;
  }
};

MusicHandler.prototype.sendScanResult = function(cmd) {
  var musicsCount = 0;
  this.enableListening = true;
  var handle = this.musicDB.enumerate('metadata.title', function(music) {
    if (!enableListening) {
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
    id: e.id,
    flag: CMD_TYPE.music_getChanged,
    datalength: 0
  };
  if (!this.musicDB || this.musicDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.MUSIC_INIT));
    return;
  }

  this.musicDB.onscanend = function() {
    cmd.flag = RS_OK;
    this.app.serverManager.send(cmd, int2Array(RS_OK));
  }.bind(this);

  this.musicDB.oncreated = function(event) {
    var responseCmd = {
      id: CMD_ID.listen_music,
      flag: CMD_TYPE.music_getChanged,
      datalength: 0
    };
    event.detail.forEach(function(music) {
      this.sendMusic(true, responseCmd, music);
    }.bind(this));
  }.bind(this);

  this.musicDB.ondeleted = function(event) {
    var responseCmd = {
      id: CMD_ID.listen_music,
      flag: CMD_TYPE.music_delete,
      datalength: 0
    };
    this.app.serverManager.update(responseCmd, string2Array(JSON.stringify(event.detail)));
  }.bind(this);

  this.musicDB.scan();
};

MusicHandler.prototype.deleteMusic = function(e) {
  var cmd = {
    id: e.id,
    flag: CMD_TYPE.music_delete,
    datalength: 0
  };
  if (this.musicDBStatus != RS_OK) {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.MUSIC_INIT));
    return;
  }

  var fileName = array2String(e.data);
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

  this.app.serverManager.update(cmd, string2Array(JSON.stringify(fileInfo)));
};

exports.MusicHandler = MusicHandler;
})(window);
