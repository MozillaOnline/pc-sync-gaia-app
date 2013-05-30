/*------------------------------------------------------------------------------------------------------------
 *File Name: ContactHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage contact
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function contactHelper(socket, jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.command) {
    case CONTACT_COMMAND.addContact:
      {
        addContact(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    case CONTACT_COMMAND.clearAllContacts:
      {
        clearAllContacts(socket, jsonCmd, sendCallback);
        break;
      }
    case CONTACT_COMMAND.getAllContacts:
      {
        getAllContacts(socket, jsonCmd, sendCallback);
        break;
      }
    case CONTACT_COMMAND.getContactById:
      {
        getContactById(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    case CONTACT_COMMAND.getContactPicById:
      {
        getContactPicById(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    case CONTACT_COMMAND.removeContactById:
      {
        removeContactById(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    case CONTACT_COMMAND.updateContactById:
      {
        updateContactById(socket, jsonCmd, sendCallback, recvList);
        break;
      }
    default:
      {
        console.log('ContactHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;

        sendCallback(socket, jsonCmd, null, null);
        break;
      }
    }
  } catch (e) {
    console.log('ContactHelper.js contactHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function addContact(socket, jsonCmd, sendCallback, recvList) {
  try {
    var contactData = recvList.shift();
    var newContact = new mozContact();
    console.log('ContactHelper.js addContact contactData is: ' + contactData);
    var jsonContact = JSON.parse(contactData)
    newContact.init(jsonContact);
    if (jsonContact.photo.length > 0) {
      newContact.photo = [dataUri2Blob(jsonContact.photo[0])];
    }
    var saveRequest = window.navigator.mozContacts.save(newContact);
    saveRequest.onsuccess = function() {
      var options = {
        filterBy: ['id'],
        filterOp: 'equals',
        filterValue: newContact.id
      };
      var request = window.navigator.mozContacts.find(options);
      request.onsuccess = function(e) {
        if (e.target.result.length == 0) {
          jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, null, null);
        } else {
          jsonCmd.result = RS_OK;
          var foundContact = JSON.stringify(e.target.result[0]);
          jsonCmd.firstDatalength = foundContact.length;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, foundContact, null);
        }
      };
      request.onerror = function() {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      };
    };
    saveRequest.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_ADDCONTACT;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js addContact failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function clearAllContacts(socket, jsonCmd, sendCallback) {
  try {
    var request = window.navigator.mozContacts.clear();
    request.onsuccess = function() {
      jsonCmd.result = RS_OK;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_CLEARALLCONTACTS;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js clearAllContacts failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getAllContacts(socket, jsonCmd, sendCallback) {
  try {
    var options = {
      sortBy: 'familyName',
      sortOrder: 'ascending'
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function() {
      jsonCmd.result = RS_OK;
      if (request.result.length > 0) {
        var contactsData = JSON.stringify(request.result);
        jsonCmd.firstDatalength = contactsData.length;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, contactsData, null);
      } else {
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETALLCONTACTS;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js getAllContacts failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getContactById(socket, jsonCmd, sendCallback, recvList) {
  try {
    var contactData = recvList.shift();
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: contactData
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function(e) {
      console.log('ContactHelper.js getContactById e.target.result: ' + e.target.result.length);
      if (e.target.result.length == 0) {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      } else {
        jsonCmd.result = RS_OK;

        var contactData = JSON.stringify(e.target.result[0]);
        jsonCmd.firstDatalength = contactData.length;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, contactData, null);
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js getContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function getContactPicById(socket, jsonCmd, sendCallback, recvList) {
  try {
    var contactData = recvList.shift();
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: contactData
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function() {
      if ((request.result.length > 0) && (request.result[0].photo != null) && (request.result[0].photo.length > 0)) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(request.result[0].photo[0]);
        fileReader.onload = function(e) {
          jsonCmd.result = RS_OK;

          jsonCmd.firstDatalength = e.target.result.length;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, e.target.result, null);

        }
      } else {
        jsonCmd.result = RS_ERROR.CONTACT_NOCONTACTPIC;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETCONTACTPIC;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js getContactPicById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function removeContactById(socket, jsonCmd, sendCallback, recvList) {
  try {
    var contactData = recvList.shift();
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: contactData
    };
    var findRequest = window.navigator.mozContacts.find(options);
    findRequest.onsuccess = function(e) {
      if (e.target.result.length == 0) {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      } else {
        var request = window.navigator.mozContacts.remove(e.target.result[0]);
        request.onsuccess = function(e) {
          jsonCmd.result = RS_OK;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, null, null);
        }
        request.onerror = function() {
          jsonCmd.result = RS_ERROR.CONTACT_REMOVECONTACT;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, null, null);
        };
      }
    };
    findRequest.onerror = function() {
      console.log('pcsync contact.js line108');
      jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js removeContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }
}

function updateContactById(socket, jsonCmd, sendCallback, recvList) {
  try {
    var contactData = recvList.shift();
    var newContact = JSON.parse(contactData);
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: newContact.id
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function(e) {
      if (e.target.result.length == 0) {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      } else {
        var updateContact = e.target.result[0];
        for (var uname in newContact) {
          if (uname == 'photo' && newContact.photo.length > 0) {
            updateContact.photo = [dataUri2Blob(newContact.photo[0])];
          } else {
            updateContact[uname] = newContact[uname];
          }
        }
        var saveRequest = window.navigator.mozContacts.save(updateContact);
        saveRequest.onsuccess = function() {
          jsonCmd.result = RS_OK;

          var savedContact = JSON.stringify(updateContact);
          jsonCmd.firstDatalength = savedContact.length;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, savedContact, null);
        };
        saveRequest.onerror = function() {
          jsonCmd.result = RS_ERROR.CONTACT_SAVECONTACT;
          jsonCmd.firstDatalength = 0;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, null, null);
        };
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js updateContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket, jsonCmd, null, null);
  }

}