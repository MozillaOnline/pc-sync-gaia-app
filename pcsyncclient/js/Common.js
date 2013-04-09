/*------------------------------------------------------------------------------------------------------------
 *File Name: Common.js
 *Created By: dxue@mozilla.com
 *Description: Shared function and define
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

var MAX_PACKAGE_SIZE = 65536;
var TITLE_SIZE = 24;

var CMD_TYPE = {
  app: 1,
  contact: 2,
  deviceInfo: 3,
  music: 4,
  sms: 5,
  picture: 6,
  video: 7,
  file: 8
};

var APP_COMMAND = {
  getAllApps: 1,
  getInstalledApps: 2,
  uninstallAppByName: 3
};

var CONTACT_COMMAND = {
  addContact: 1,
  clearAllContacts: 2,
  getAllContacts: 3,
  getContactById: 4,
  getContactPicById: 5,
  removeContactById: 6,
  updateContactById: 7
};

var DEVICEINFO_COMMAND = {
  getStorage: 1
};

var FILE_COMMAND = {
  addFile: 1,
  getFileByPath:2,
  renameFile:3
};

var MUSIC_COMMAND = {
  deleteMusicByPath: 1,
  getAllMusicsInfo: 2,
  initMusic: 3,
  renameMusic: 4
};

var PICTURE_COMMAND = {
  deletePictureByPath: 1,
  getAllPicturesInfo: 2,
  initPicture: 3,
  renamePicture: 4
};

var SMS_COMMAND = {
  deleteMessageById: 1,
  getAllMessages: 2,
  getMessageById: 3,
  listenMessage: 4,
  markReadMessageById: 5,
  sendMessage: 6,
  sendMessages: 7
};

var VIDEO_COMMAND = {
  deleteVideoByPath: 1,
  getAllVideosInfo: 2,
  initVideo: 3,
  renameVideo: 4
};

var RS_OK = 0;
var RS_ERROR = {
  UNKNOWEN: 1,
  TYPE_UNDEFINED: 2,
  COMMAND_UNDEFINED: 3,
  DEVICEINFO_GETSTORAGE: 4,
  SMS_DELETEMESSAGE: 5,
  SMS_MESSAGE_NOTFOUND: 6,
  SMS_GETMESSAGE: 7,
  SMS_GETALLMESSAGES: 8,
  SMS_MARDREAD: 9,
  SMS_SENDMESSAGE: 10,
  SMS_EMPTYNUMBER: 11,
  CONTACT_ADDCONTACT: 12,
  CONTACT_CONTACT_NOTFOUND: 13,
  CONTACT_CLEARALLCONTACTS: 14,
  CONTACT_GETALLCONTACTS: 15,
  CONTACT_GETCONTACT: 16,
  CONTACT_NOCONTACTPIC: 17,
  CONTACT_GETCONTACTPIC: 18,
  CONTACT_REMOVECONTACT: 19,
  CONTACT_SAVECONTACT: 20,
  APPSMANAGER_GETINSTALLEDAPPS: 21,
  APPSMANAGER_GETALLAPPS: 22,
  APPSMANAGER_UNSTALLAPP: 23,
  APPSMANAGER_NOTFOUNDAPP: 24,
  DEVICESTORAGE_UNAVAILABLE: 25,
  MUSIC_INIT:26,
  MUSIC_RENAME: 27,
  PICTURE_INIT:28,
  PICTURE_RENAME: 29,
  VIDEO_INIT:30,
  VIDEO_RENAME: 31,
  MEDIADB_ADDFILE: 32,
  FILE_CREATE: 33,
  FILE_GET: 34,
  FILE_WRITE: 35,
  OPEN_DB: 36
};

function printArray(array) {
  var value = [];
  for (var i = 0; i < array.length; i++) {
    value[i] = array[i];
  }
  console.log(value.join(','))
}

function createNewArray(array) {
  var newArray = Uint8Array(array.length);
  for (var i = 0; i < array.length; i++) {
    newArray[i] = array[i];
  }
  return newArray;
}

function dataUri2Blob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  var array = [];
  for (var i = 0; i < byteString.length; i++) {
    array.push(byteString.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {
    type: mimeString
  });
}

function string2Utf8Array(byteString) {
  return TextEncoder('utf-8').encode(byteString);
}

//dataArray.length == TITLE_SIZE


function titleArray2Json(dataArray) {
  if (dataArray.length >= TITLE_SIZE) {
    var dataBuffer = new ArrayBuffer(TITLE_SIZE);
    var titleArray = new Uint8Array(dataBuffer);
    var int32Array = new Int32Array(dataBuffer);
    for (var i = 0; i < titleArray.length; i++) {
      titleArray[i] = dataArray[i];
    }
    var dataJson = {
      id: int32Array[0],
      type: int32Array[1],
      command: int32Array[2],
      result: int32Array[3],
      firstDatalength: int32Array[4],
      secondDatalength: int32Array[5],
      datalength: int32Array[4] + int32Array[5]
    };
    return dataJson;
  } else {
    return null;
  }
}

function json2TitleArray(dataJson) {
  var dataArray = new ArrayBuffer(TITLE_SIZE);
  var int8Array = new Uint8Array(dataArray);
  var int32Array = new Int32Array(dataArray);
  if (isNaN(dataJson.id) || isNaN(dataJson.id) || isNaN(dataJson.id) || isNaN(dataJson.id) || isNaN(dataJson.id) || isNaN(dataJson.id)) {
    return null;
  }
  int32Array[0] = dataJson.id;
  int32Array[1] = dataJson.type;
  int32Array[2] = dataJson.command;
  int32Array[3] = dataJson.result;
  int32Array[4] = dataJson.firstDatalength;
  int32Array[5] = dataJson.secondDatalength;
  return int8Array;
}

function jsonAndFirstData2Array(dataJson, dataString) {
  var titleArray = json2TitleArray(dataJson);
  if (titleArray == null) {
    return null;
  }
  var dataArray = string2Utf8Array(dataString);
  var int8Array = new Uint8Array(titleArray.length + dataArray.length);
  int8Array.set(titleArray, 0);
  int8Array.set(dataArray, titleArray.length);
  console.log('AppsManagerHelper.js getInstalledApps int8Array: ' + int8Array.length);
  return int8Array;
}

function jsonAndSecondData2Array(dataJson, dataArray) {
  var titleArray = json2TitleArray(dataJson);
  if (titleArray == null) {
    return null;
  }
  var int8Array = new Uint8Array(titleArray.length + dataArray.length);
  int8Array.set(titleArray, 0);
  int8Array.set(dataArray, titleArray.length);
  console.log('AppsManagerHelper.js getInstalledApps int8Array: ' + int8Array.length);
  return int8Array;
}