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
  video: 7
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

var MUSIC_COMMAND = {
  addMusic: 1,
  deleteMusicByPath: 2,
  getAllMusicsInfo: 3,
  getMusicByPath: 4,
  initMusic: 5,
  renameMusic: 6
};

var PICTURE_COMMAND = {
  addPicture: 1,
  deletePictureByPath: 2,
  getAllPicturesInfo: 3,
  getPictureByPath: 4,
  initPicture: 5,
  renamePicture: 6
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
  addVideo: 1,
  deleteVideoByPath: 2,
  getAllVideosInfo: 3,
  getVideoByPath: 4,
  initVideo: 5,
  renameVideo: 6
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
  MUSIC_RENAME: 26,
  PICTURE_RENAME: 27,
  VIDEO_RENAME: 28,
  MEDIADB_ADDFILE: 29
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
    for(var i=0; i<titleArray.length; i++){
      titleArray[i] = dataArray[i];
    }
    var dataJson = {
      id: int32Array[0],
      type: int32Array[1],
      command: int32Array[2],
      result: int32Array[3],
      smallDatalength: int32Array[4],
      largeDatalength: int32Array[5],
      datalength: int32Array[4]+int32Array[5]
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
  int32Array[0] = dataJson.id;
  int32Array[1] = dataJson.type;
  int32Array[2] = dataJson.command;
  int32Array[3] = dataJson.result;
  int32Array[4] = dataJson.smallDatalength;
  int32Array[5] = dataJson.largeDatalength;
  return int8Array;
}

function jsonAndData2Array(dataJson, dataString) {
  var titleArray = json2TitleArray(dataJson);
  var dataArray = string2Utf8Array(dataString);
  var int8Array = new Uint8Array(titleArray.length + dataArray.length);
  int8Array.set(titleArray,0);
  int8Array.set(dataArray,titleArray.length);
  console.log('AppsManagerHelper.js getInstalledApps int8Array: ' + int8Array.length);
  return int8Array;
}