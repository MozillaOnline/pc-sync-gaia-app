/*------------------------------------------------------------------------------------------------------------
 *File Name: ContactHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage contact
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function contactHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "addContact":
      {
        addContact(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "clearAllContacts":
      {
        clearAllContacts(jsonCmd, sendCallback);
        break;
      }
    case "getAllContacts":
      {
        getAllContacts(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getContactById":
      {
        getContactById(jsonCmd, sendCallback);
        break;
      }
    case "getContactPicById":
      {
        getContactPicById(jsonCmd, sendCallback, sendList);
        break;
      }
    case "removeContactById":
      {
        removeContactById(jsonCmd, sendCallback);
        break;
      }
    case "updateContactById":
      {
        updateContactById(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    default:
      {
        debug('ContactHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('ContactHelper.js contactHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function addContact(jsonCmd, sendCallback, sendList, recvList) {
  doAdd(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data, jsonCmd.exdatalength);
}

function doAdd(jsonCmd, sendCallback, sendList, recvList, contactData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        contactData = contactData + recvList[0];
        remainder = remainder - recvList[0].length;
        recvList.remove(0);
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, contactData, remainder));
      } else {
        setTimeout(doAdd(jsonCmd, sendCallback, sendList, recvList, contactData, remainder), 20);
      }
    } else {
      var newContact = new mozContact();
      newContact.init(JSON.parse(contactData));
      var saveRequest = window.navigator.mozContacts.save(newContact);
      saveRequest.onsuccess = function() {
        var options = {
          filterBy: ['id'],
          filterOp: 'equals',
          filterValue: newContact.id
        };
        var request = window.navigator.mozContacts.find(options);
        request.onsuccess = function(e) {
          jsonCmd.result = RS_OK;
          var foundContact = JSON.stringify(e.target.result[0]);
          if (foundContact.length <= MAX_PACKAGE_SIZE) {
            jsonCmd.data = foundContact;
            jsonCmd.exdatalength = 0;
            sendCallback(jsonCmd);
          } else {
            jsonCmd.data = foundContact.substr(0, MAX_PACKAGE_SIZE);
            for (var i = MAX_PACKAGE_SIZE; i < foundContact.length; i += MAX_PACKAGE_SIZE) {
              if (i + MAX_PACKAGE_SIZE < foundContact.length) {
                sendList.push(foundContact.substr(i, MAX_PACKAGE_SIZE));
              } else {
                sendList.push(foundContact.substr(i));
              }
            }
            sendCallback(jsonCmd);
          }
        };
        request.onerror = function() {
          jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
          jsonCmd.exdatalength = 0;
          jsonCmd.data = '';
          sendCallback(jsonCmd);
        };
      };
      saveRequest.onerror = function() {
        jsonCmd.result = RS_ERROR.CONTACT_ADDCONTACT;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      };
    }
  } catch (e) {
    debug('ContactHelper.js addContact failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function clearAllContacts(jsonCmd, sendCallback) {
  try {
    var request = window.navigator.mozContacts.clear();
    request.onsuccess = function() {
      jsonCmd.result = RS_OK;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_CLEARALLCONTACTS;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    debug('ContactHelper.js clearAllContacts failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllContacts(jsonCmd, sendCallback, sendList) {
  try {
    var options = {
      sortBy: 'familyName',
      sortOrder: 'ascending'
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function() {
      jsonCmd.result = RS_OK;
      var contactsData = JSON.stringify(request.result);
      if (contactsData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = contactsData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = contactsData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = contactsData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < contactsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < contactsData.length) {
            sendList.push(contactsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(contactsData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETALLCONTACTS;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    debug('ContactHelper.js getAllContacts failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getContactById(jsonCmd, sendCallback) {
  try {
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: jsonCmd.data
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function(e) {
      jsonCmd.result = RS_OK;
      var contactData = JSON.stringify(e.target.result[0]);
      if (contactData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = contactData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = contactData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = contactData.length - MAX_PACKAGE_SIZE;
        for (i = MAX_PACKAGE_SIZE; i < contactData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < contactData.length) {
            data.push(contactData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            data.push(contactData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
      jsonCmd.data = '';
      jsonCmd.exdatalength = 0;
      sendCallback(jsonCmd);
    };
  } catch (e) {
    debug('ContactHelper.js getContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getContactPicById(jsonCmd, sendCallback, sendList) {
  try {
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: jsonCmd.data
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function() {
      if ((request.result.length > 0) && (request.result[0].photo.length > 0)) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(request.result[0].photo[0]);
        fileReader.onload = function(e) {
          jsonCmd.result = RS_OK;
          if (e.target.result.length <= MAX_PACKAGE_SIZE) {
            jsonCmd.data = e.target.result;
            jsonCmd.exdatalength = 0;
            sendCallback(jsonCmd);
          } else {
            jsonCmd.data = e.target.result.substr(0, MAX_PACKAGE_SIZE);
            jsonCmd.exdatalength = e.target.result.length - MAX_PACKAGE_SIZE;
            for (var i = MAX_PACKAGE_SIZE; i < e.target.result.length; i += MAX_PACKAGE_SIZE) {
              if (i + MAX_PACKAGE_SIZE < e.target.result.length) {
                sendList.push(e.target.result.substr(i, MAX_PACKAGE_SIZE));
              } else {
                sendList.push(e.target.result.substr(i));
              }
            }
            sendCallback(jsonCmd);
          }
        }
      } else {
        jsonCmd.result = RS_ERROR.CONTACT_NOCONTACTPIC;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETCONTACTPIC;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    debug('ContactHelper.js getContactPicById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function removeContactById(jsonCmd, sendCallback) {
  try {
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: jsonCmd.data
    };
    var findRequest = window.navigator.mozContacts.find(options);
    findRequest.onsuccess = function(e) {
      var request = window.navigator.mozContacts.remove(e.target.result[0]);
      request.onsuccess = function(e) {
        jsonCmd.result = RS_OK;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      }
      request.onerror = function() {
        jsonCmd.result = RS_ERROR.CONTACT_REMOVECONTACT;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      };
    };
    findRequest.onerror = function() {
      debug('pcsync contact.js line108');
      jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = '';
      sendCallback(jsonCmd);
    };
  } catch (e) {
    debug('ContactHelper.js removeContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function updateContactById(jsonCmd, sendCallback, sendList, recvList) {
  doUpdate(jsonCmd, sendCallback, sendList, recvList, jsonCmd.data, jsonCmd.exdatalength);
}

function doUpdate(jsonCmd, sendCallback, sendList, recvList, contactData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        contactData = contactData + recvList[0];
        remainder = remainder - recvList[0].length;
        recvList.remove(0);
        setTimeout(doUpdate(jsonCmd, sendCallback, sendList, recvList, contactData, remainder));
      } else {
        setTimeout(doUpdate(jsonCmd, sendCallback, sendList, recvList, contactData, remainder), 20);
      }
    } else {
      var newContact = JSON.parse(contactData);
      var options = {
        filterBy: ['id'],
        filterOp: 'equals',
        filterValue: newContact.id
      };
      var request = window.navigator.mozContacts.find(options);
      request.onsuccess = function(e) {
        var updateContact = e.target.result[0];
        for (var uname in newContact) {
          updateContact[uname] = newContact[uname];
        }
        var saveRequest = window.navigator.mozContacts.save(updateContact);
        saveRequest.onsuccess = function() {
          jsonCmd.result = RS_OK;
          var savedContact = JSON.stringify(updateContact);
          if (savedContact.length <= MAX_PACKAGE_SIZE) {
            jsonCmd.data = savedContact;
            jsonCmd.exdatalength = 0;
            sendCallback(jsonCmd);
          } else {
            jsonCmd.data = savedContact.substr(0, MAX_PACKAGE_SIZE);
            for (var i = MAX_PACKAGE_SIZE; i < savedContact.length; i += MAX_PACKAGE_SIZE) {
              if (i + MAX_PACKAGE_SIZE < savedContact.length) {
                sendList.push(savedContact.substr(i, MAX_PACKAGE_SIZE));
              } else {
                sendList.push(savedContact.substr(i));
              }
            }
            sendCallback(jsonCmd);
          }
        };
        saveRequest.onerror = function() {
          jsonCmd.result = RS_ERROR.CONTACT_SAVECONTACT;
          jsonCmd.exdatalength = 0;
          jsonCmd.data = '';
          sendCallback(jsonCmd);
        };
      };
      request.onerror = function() {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      };
    }
  } catch (e) {
    debug('ContactHelper.js updateContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}