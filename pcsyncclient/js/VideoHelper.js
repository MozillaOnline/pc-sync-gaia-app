var videodb;
var bInited = false;
var bRename = false;
var oldName;

function initDB() {
  videodb = new MediaDB('videos', metaDataParser);
  
  videodb.onunavailable = function(event) {
    //get all the reasons from event
    dump("=====videodb is unavailable");
  };
  videodb.onready = function() {
   // self.videodb.scan();
    dump("=====videodb is ready");
  };
  videodb.onscanstart = function() {
    dump("=====videodb scan start");
  };
  videodb.onscanend = function() {
    self.bInited = true;
    dump("=====videodb scan end");
  };
  videodb.oncreated = function(event) {
    dump("=====video file create");
    if(self.bRename) {
      self.bRename = false;
      self.videodb.deleteFile(self.oldName);
    }
  };
  videodb.ondeleted = function(event) {
    dump("=====video deleted");
  };
}

function videoHelper(jsonCmd, sendCallback, sendList, recvList) {
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
    case "getAllVideosInfo":
      {
        getAllVideosInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getVideo":
      {
        getVideo(jsonCmd, sendCallback, sendList);
        break;
      }
    case "addVideo":
      {
        addVideo(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "deleteVideo":
      {
        deleteVideo(jsonCmd, sendCallback);
        break;
      }
    case "renameVideo":
      {
        renameVideo(jsonCmd, sendCallback);
        break;
      }
    default:
      {
        debug('VideoHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('VideoHelper.js smsHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllVideosInfo(jsonCmd, sendCallback, sendList) {
  try {
    videodb.getAll(function(records) {
      var videos = records;
      var result = [];
  
      for(var i=0; i<videos.length; i++) {
        if(!videos[i].metadata.isVideo){ 
          continue;
        }
        var fileInfo = {
          name:null,
          type:null,
          size:0,
          date:0
        };
        fileInfo.name = videos[i].name;
        fileInfo.type = videos[i].type;
        fileInfo.size = videos[i].size;
        fileInfo.date = videos[i].date;
        result.push(fileInfo);
      }
      jsonCmd.result = RS_OK;
      var videosData = JSON.stringify(result);
      if (videosData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = videosData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = videosData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = videosData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < videosData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < videosData.length) {
            sendList.push(videosData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(videosData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    });
  } catch(e) {
    debug('VideoHelper.js getAllPicsInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getVideo(jsonCmd, sendCallback, sendList) {
  try {
    videodb.getFile(jsonCmd.data,function(file) {
      var fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = function fileLoad(e) {
        var videodata = {
          action: 'response',
          id: jsonCmd.requestid,
          command: jsonCmd.requestcommand,
          status: 200,
          data: e.target.result
        }
        jsonCmd.result = RS_OK;
        var videosData = JSON.stringify(videodata);
        if (videosData.length <= MAX_PACKAGE_SIZE) {
          jsonCmd.data = videosData;
          jsonCmd.exdatalength = 0;
          sendCallback(jsonCmd);
        } else {
          jsonCmd.data = videosData.substr(0, MAX_PACKAGE_SIZE);
          jsonCmd.exdatalength = videosData.length - MAX_PACKAGE_SIZE;
          for (var i = MAX_PACKAGE_SIZE; i < videosData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < videosData.length) {
              sendList.push(videosData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(videosData.substr(i));
            }
          }
          sendCallback(jsonCmd);
        }
      };
    });
  } catch (e) {
    debug('VideoHelper.js getPics failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addVideo(jsonCmd, sendCallback, sendList, recvList) {
  doAdd(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data[1], jsonCmd.exdatalength);
}

function doAdd(jsonCmd, sendCallback, sendList, recvList, videoData, remainder) {
  try {
    if (remainder > 0) {
      var recvData;
      if (recvList.length > 0) {
        videoData += recvList[0];
        remainder -= recvList[0].length;
        recvList.remove(0);
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, videoData, remainder));
      } else {
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, videoData, remainder), 20);
      }
    } else {
      videodb.addFile(jsonCmd.data[0], dataURItoBlob(videoData));
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    }
  } catch (e) {
    debug('VideoHelper.js addPic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function deleteVideo(jsonCmd, sendCallback) {
  try {
    videodb.deleteFile(jsonCmd.data);
    jsonCmd.result = RS_OK;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  } catch (e) {
    debug('VideoHelper.js deletePic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function renameVideo(jsonCmd, sendCallback) {
  try {
    var oldFile = jsconCmd.data[0];
    var newFile = jsconCmd.data[1];
    videodb.getFile(oldFile, function(file) {
      videodb.addFile(newFile, file);
      oldName = oldFile;
      bRename = true;
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    });
  } catch (e) {
    debug('VideoHelper.js renamePic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}
