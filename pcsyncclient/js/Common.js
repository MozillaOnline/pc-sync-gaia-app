/*------------------------------------------------------------------------------------------------------------
 *File Name: Common.js
 *Created By: dxue@mozilla.com
 *Description: Shared function and define
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

var MAX_PACKAGE_SIZE = 2048;

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
  CONTACT_ADDCONTACT: 11,
  CONTACT_CONTACT_NOTFOUND: 12,
  CONTACT_CLEARALLCONTACTS: 13,
  CONTACT_GETALLCONTACTS: 14,
  CONTACT_GETCONTACT: 15,
  CONTACT_NOCONTACTPIC: 16,
  CONTACT_GETCONTACTPIC: 17,
  CONTACT_REMOVECONTACT: 18,
  CONTACT_SAVECONTACT: 19
};

function debug(msg) {
  console.log('-*- pc sync client -*-' + msg);
}

function printArray(array) {
  var value = [];
  for (var i = 0; i < array.length; i++) {
    value[i] = array[i];
  }
  debug(value.join(','))
}

function createNewArray(array) {
  var newArray = Uint8Array(array.length);
  for (var i = 0; i < array.length; i++) {
    newArray[i] = array[i];
  }
  return newArray;
}

Array.prototype.remove = function(dx) {
  if (isNaN(dx) || dx > this.length) {
    return false;
  }
  for (var i = 0, n = 0; i < this.length; i++) {
    if (this[i] != this[dx]) {
      this[n++] = this[i]
    }
  }
  this.length -= 1
}

Array.prototype.removeAll = function() {
  this.length = 0
}

function dataURItoBlob(dataURI) {
  var byteString = atob(dataURI.split(',')[1]);
  var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
  var array = [];
  for(var i=0; i < byteString.length; i++) {
    array.push(byteString.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)],{type:mimeString});
}

