var photodb;
var bInited = false;
var bRename = false;
var oldName;

function initDB() {
  photodb = new MediaDB('pictures', metadataParsers.imageMetadataParser, {
    mimeTypes: ['image/jpeg','image/png'],
    version: 2,
    autoscan: false,
    batchHoldTime: 350,
    batchSize: 12
  });
  
  photodb.onunavailable = function(event) {
    //get all the reasons from event
    dump("=====photodb is unavailable");
  };
  photodb.onready = function() {
    photodb.scan();
    dump("=====photodb is ready");
  };
  photodb.onscanstart = function() {
    dump("=====photodb scan start");
  };
  photodb.onscanend = function() {
    bInited = true;
    dump("=====photodb scan end");
  };
  photodb.oncreated = function(event) {
    dump("=====pic file create");
    if(bRename) {
      bRename = false;
      photodb.deleteFile(oldName);
    }
  };
  photodb.ondeleted = function(event) {
    dump("=====pic deleted");
  };
}

function picHelper(jsonCmd, sendCallback, sendList, recvList) {
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
    case "getAllPicsInfo":
      {
        getAllPicsInfo(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getPics":
      {
        getPics(jsonCmd, sendCallback, sendList);
        break;
      }
    case "addPic":
      {
        addPic(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "deletePic":
      {
        deletePic(jsonCmd, sendCallback);
        break;
      }
    case "renamePic":
      {
        renamePic(jsonCmd, sendCallback);
        break;
      }
    default:
      {
        debug('PicHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('PicHelper.js smsHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllPicsInfo(jsonCmd, sendCallback, sendList) {
  try {
    photodb.getAll(function(records) {
      var photos = records;
      var result = [];
  
      for(var i=0; i<photos.length; i++) {
        var fileInfo = {
          name:null,
          type:null,
          size:0,
          date:0
        };
        fileInfo.name = photos[i].name;
        fileInfo.type = photos[i].type;
        fileInfo.size = photos[i].size;
        fileInfo.date = photos[i].date;
        result.push(fileInfo);
      }
      jsonCmd.result = RS_OK;
      var picsData = JSON.stringify(result);
      if (picsData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = picsData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = picsData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = picsData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < picsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < picsData.length) {
            sendList.push(picsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(picsData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    });
  } catch(e) {
    debug('PicHelper.js getAllPicsInfo failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getPics(jsonCmd, sendCallback, sendList) {
  try {
    photodb.getFile(jsonCmd.data,function getPic(file) {
      var fr = new FileReader();
      fr.readAsDataURL(file);
      fr.onload = function fileLoad(e) {
        var picsdata = {
          action: 'response',
          id: jsonCmd.requestid,
          command: jsonCmd.requestcommand,
          status: 200,
          data: e.target.result
        }
        jsonCmd.result = RS_OK;
        var picsData = JSON.stringify(result);
        if (picsData.length <= MAX_PACKAGE_SIZE) {
          jsonCmd.data = picsData;
          jsonCmd.exdatalength = 0;
          sendCallback(jsonCmd);
        } else {
          jsonCmd.data = picsData.substr(0, MAX_PACKAGE_SIZE);
          jsonCmd.exdatalength = picsData.length - MAX_PACKAGE_SIZE;
          for (var i = MAX_PACKAGE_SIZE; i < picsData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < picsData.length) {
              sendList.push(picsData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(picsData.substr(i));
            }
          }
          sendCallback(jsonCmd);
        }
      };
    });
  } catch (e) {
    debug('PicHelper.js getPics failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addPic(jsonCmd, sendCallback, sendList, recvList) {
  doAdd(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data[1], jsonCmd.exdatalength);
}

function doAdd(jsonCmd, sendCallback, sendList, recvList, picData, remainder) {
  try {
    if (remainder > 0) {
      var recvData;
      if (recvList.length > 0) {
        picData += recvList[0];
        remainder -= recvList[0].length;
        recvList.remove(0);
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, picData, remainder));
      } else {
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, picData, remainder), 20);
      }
    } else {
      photodb.addFile(jsonCmd.data[0], dataURItoBlob(picData));
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    }
  } catch (e) {
    debug('PicHelper.js addPic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function deletePic(jsonCmd, sendCallback) {
  try {
    photodb.deleteFile(jsonCmd.data);
    jsonCmd.result = RS_OK;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  } catch (e) {
    debug('PicHelper.js deletePic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function renamePic(jsonCmd, sendCallback) {
  try {
    var oldFile = jsconCmd.data[0];
    var newFile = jsconCmd.data[1];
    photodb.getFile(oldFile, function(file) {
      photodb.addFile(newFile, file);
      oldName = oldFile;
      bRename = true;
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    });
  } catch (e) {
    debug('PicHelper.js renamePic failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}
