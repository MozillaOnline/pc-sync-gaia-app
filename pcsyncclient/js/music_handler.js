'use strict';

(function(exports) {

var MusicHandler = function(app) {
  this.app = app;
  this.musicDB = null;
  this.started = false;
};

MusicHandler.prototype.start = function() {
  if (this.started) {
    console.log('MusicHandler is running.');
    return;
  }

  this.started = true;
  this.musicDBStatus = null;
  this.cachedCmd = null;

  this.musicDB = new MediaDB('music', parseAudioMetadata, {
    indexes: ['metadata.album', 'metadata.artist', 'metadata.title',
              'metadata.rated', 'metadata.played', 'date'],
    batchSize: 1,
    autoscan: false,
    version: 2
  });

  this.musicDB.onunavailable = function(event) {
    this.musicDBStatus = RS_ERROR.MUSIC_INIT;
    this.sendCachedCmd();
  }.bind(this);

  this.musicDB.oncardremoved = function oncardremoved() {
    this.musicDBStatus = RS_ERROR.MUSIC_INIT;
    this.sendCachedCmd();
  }.bind(this);

  this.musicDB.onready = function() {
    this.musicDBStatus = RS_OK;
    this.sendCachedCmd();
  }.bind(this);
};

MusicHandler.prototype.stop = function() {
  if (!this.started) {
    console.log('MusicHandler has been stopped.');
    return;
  }

  this.started = false;

  this.musicDB = null;
  this.musicDBStatus = null;
};

MusicHandler.prototype.handleMessage = function(cmd, data) {
  try {
    switch (cmd.command) {
      case MUSIC_COMMAND.getOldMusicsInfo:
        this.getMusicsInfo(cmd);
        break;
      case MUSIC_COMMAND.getChangedMusicsInfo:
        this.getChangedMusicsInfo(cmd);
        break;
      case MUSIC_COMMAND.deleteMusic:
        this.deleteMusic(cmd, data);
        break;
      default:
        cmd.result = RS_ERROR.COMMAND_UNDEFINED;
        this.app.serverManager.send(cmd, null);
        break;
    }
  } catch (e) {
    cmd.result = RS_ERROR.UNKNOWEN;
    this.app.serverManager.send(cmd, null);
  }
};

MusicHandler.prototype.getMusicsInfo = function(cmd) {
  switch (this.musicDBStatus) {
    case RS_OK:
      this.sendScanResult(cmd);
      break;
    case RS_ERROR.MUSIC_INIT:
      cmd.result = RS_ERROR.MUSIC_INIT;
      this.app.serverManager.send(cmd, null);
      break;
    default:
      this.cachedCmd = cmd;
      break;
  }
};

MusicHandler.prototype.sendCachedCmd = function() {
  if (!this.cachedCmd) {
    return;
  }

  this.cachedCmd.result = this.musicDBStatus;

  if (this.musicDBStatus == RS_OK) {
    this.sendScanResult(this.cachedCmd);
  } else {
    this.app.serverManager.send(this.cachedCmd, null);
  }
};

MusicHandler.prototype.sendScanResult = function(cmd) {
  var musicsCount = 0;
  var handle = this.musicDB.enumerate('metadata.title', function(music) {
    if (!this.app.started) {
      this.musicDB.cancelEnumeration(handle);
      return;
    }

    if (!music) {
      var musicMessage = {
        type: 'music',
        callbackID: 'enumerate-done',
        detail: musicsCount
      };

      cmd.result = RS_OK;
      this.app.serverManager.send(cmd, JSON.stringify(musicMessage));
      return;
    }

    musicsCount++;
    cmd.result = RS_MIDDLE;
    this.sendMusic(false, cmd, music);
  }.bind(this));
};

MusicHandler.prototype.getChangedMusicsInfo = function(cmd) {
  if (!this.musicDB || this.musicDBStatus != RS_OK) {
    cmd.result = RS_ERROR.MUSIC_INIT;
    this.app.serverManager.send(cmd, null);
    return;
  }

  this.musicDB.onscanend = function() {
    cmd.result = RS_OK;
    this.app.serverManager.send(cmd, null);
  }.bind(this);

  this.musicDB.oncreated = function(event) {
    event.detail.forEach(function(music) {
      this.sendMusic(true, null, music);
    }.bind(this));
  }.bind(this);

  this.musicDB.ondeleted = function(event) {
    var musicMessage = {
      type: 'music',
      callbackID: 'ondeleted',
      detail: event.detail
    };

    var listenJsonCmd = {
      id: 0,
      type: CMD_TYPE.listen,
      command: 0,
      result: RS_OK,
      datalength: 0,
      subdatalength: 0
    };

    this.app.serverManager.update(listenJsonCmd, JSON.stringify(musicMessage));
  }.bind(this);

  this.musicDB.scan();
};

MusicHandler.prototype.deleteMusic = function(cmd, data) {
  if (this.musicDBStatus != RS_OK) {
    cmd.result = RS_ERROR.MUSIC_INIT;
    this.app.serverManager.send(cmd, null);
    return;
  }

  var fileName = array2String(data);
  this.musicDB.deleteFile(fileName);
  cmd.result = RS_OK;
  this.app.serverManager.send(cmd, null);
};

MusicHandler.prototype.sendMusic = function(isListen, cmd, music) {
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

  if (!isListen) {
    this.app.serverManager.send(cmd, JSON.stringify(musicMessage));
    return;
  }

  var listenJsonCmd = {
    id: 0,
    type: CMD_TYPE.listen,
    command: 0,
    result: RS_OK,
    datalength: 0,
    subdatalength: 0
  };
  this.app.serverManager.update(listenJsonCmd, JSON.stringify(musicMessage));
};

exports.MusicHandler = MusicHandler;
})(window);
