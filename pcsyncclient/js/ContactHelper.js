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
    case CONTACT_COMMAND.addContact:
      {
        addContact(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CONTACT_COMMAND.clearAllContacts:
      {
        clearAllContacts(jsonCmd, sendCallback);
        break;
      }
    case CONTACT_COMMAND.getAllContacts:
      {
        getAllContacts(jsonCmd, sendCallback, sendList);
        break;
      }
    case CONTACT_COMMAND.getContactById:
      {
        getContactById(jsonCmd, sendCallback, recvList);
        break;
      }
    case CONTACT_COMMAND.getContactPicById:
      {
        getContactPicById(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CONTACT_COMMAND.removeContactById:
      {
        removeContactById(jsonCmd, sendCallback, recvList);
        break;
      }
    case CONTACT_COMMAND.updateContactById:
      {
        updateContactById(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    default:
      {
        console.log('ContactHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;

        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('ContactHelper.js contactHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function addContact(jsonCmd, sendCallback, sendList, recvList) {
  var contactData = recvList.shift();
  var lastDatalen = jsonCmd.datalength - contactData.length;
  console.log('tcpServerHelper.js jsonCmd.datalength  is: ' + jsonCmd.datalength);
  console.log('tcpServerHelper.js contactData.length is: ' + contactData.length);
  console.log('tcpServerHelper.js contactData is: ' + contactData);
  doAddContact(jsonCmd, sendCallback, sendList, recvList, contactData, lastDatalen);
}

function doAddContact(jsonCmd, sendCallback, sendList, recvList, contactData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        var recvData = recvList.shift();
        console.log('tcpServerHelper.js recvData is: ' + recvData);
        contactData = contactData + recvData;
        remainder = remainder - recvData.length;
        console.log('tcpServerHelper.js contactData2 is: ' + contactData);
        setTimeout(function() {
          doAddContact(jsonCmd, sendCallback, sendList, recvList, contactData, remainder);
        }, 0);
      } else {
        setTimeout(function() {
          doAddContact(jsonCmd, sendCallback, sendList, recvList, contactData, remainder);
        }, 20);
      }
    } else {
      var newContact = new mozContact();
      console.log('ContactHelper.js addContact contactData is: ' + contactData);
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
          if (e.target.result.length == 0) {
            jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
            jsonCmd.smallDatalength = 0;
            jsonCmd.largeDatalength = 0;
            sendCallback(jsonCmd, null);
          } else {
            jsonCmd.result = RS_OK;
            var foundContact = JSON.stringify(e.target.result[0]);
            jsonCmd.smallDatalength = foundContact.length;
            jsonCmd.largeDatalength = 0;
            if (foundContact.length <= MAX_PACKAGE_SIZE) {
              sendCallback(jsonCmd, foundContact);
            } else {
              sendCallback(jsonCmd, foundContact.substr(0, MAX_PACKAGE_SIZE));
              for (var i = MAX_PACKAGE_SIZE; i < foundContact.length; i += MAX_PACKAGE_SIZE) {
                if (i + MAX_PACKAGE_SIZE < foundContact.length) {
                  sendList.push(foundContact.substr(i, MAX_PACKAGE_SIZE));
                } else {
                  sendList.push(foundContact.substr(i));
                }
              }
            }
          }
        };
        request.onerror = function() {
          jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
          jsonCmd.smallDatalength = 0;
          jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, null);
        };
      };
      saveRequest.onerror = function() {
        jsonCmd.result = RS_ERROR.CONTACT_ADDCONTACT;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      };
    }
  } catch (e) {
    console.log('ContactHelper.js addContact failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function clearAllContacts(jsonCmd, sendCallback) {
  try {
    var request = window.navigator.mozContacts.clear();
    request.onsuccess = function() {
      jsonCmd.result = RS_OK;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_CLEARALLCONTACTS;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('ContactHelper.js clearAllContacts failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
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
      jsonCmd.smallDatalength = contactsData.length;
      jsonCmd.largeDatalength = 0;
      if (contactsData.length <= MAX_PACKAGE_SIZE) {
        sendCallback(jsonCmd, contactsData);
      } else {
        sendCallback(jsonCmd, contactsData.substr(0, MAX_PACKAGE_SIZE));
        for (var i = MAX_PACKAGE_SIZE; i < contactsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < contactsData.length) {
            sendList.push(contactsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(contactsData.substr(i));
          }
        }
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETALLCONTACTS;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('ContactHelper.js getAllContacts failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getContactById(jsonCmd, sendCallback, recvList) {
  try {
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: recvList[0]
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function(e) {
      console.log('ContactHelper.js getContactById e.target.result: ' + e.target.result.length);
      if (e.target.result.length == 0) {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      } else {
        jsonCmd.result = RS_OK;

        var contactData = JSON.stringify(e.target.result[0]);
        jsonCmd.smallDatalength = contactData.length;
        jsonCmd.largeDatalength = 0;
        if (contactData.length <= MAX_PACKAGE_SIZE) {
          sendCallback(jsonCmd, contactData);
        } else {
          sendCallback(jsonCmd, contactData.substr(0, MAX_PACKAGE_SIZE));
          for (var i = MAX_PACKAGE_SIZE; i < contactData.length; i += MAX_PACKAGE_SIZE) {
            if (i + MAX_PACKAGE_SIZE < contactData.length) {
              sendList.push(contactData.substr(i, MAX_PACKAGE_SIZE));
            } else {
              sendList.push(contactData.substr(i));
            }
          }
        }
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('ContactHelper.js getContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getContactPicById(jsonCmd, sendCallback, sendList, recvList) {
  try {
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: recvList[0]
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function() {
      if ((request.result.length > 0) && (request.result[0].photo != null) && (request.result[0].photo.length > 0)) {
        var fileReader = new FileReader();
        fileReader.readAsDataURL(request.result[0].photo[0]);
        fileReader.onload = function(e) {
          jsonCmd.result = RS_OK;

          jsonCmd.smallDatalength = e.target.result.length;
          jsonCmd.largeDatalength = 0;
          if (e.target.result.length <= MAX_PACKAGE_SIZE) {
            sendCallback(jsonCmd, e.target.result);
          } else {
            sendCallback(jsonCmd, e.target.result.substr(0, MAX_PACKAGE_SIZE));
            for (var i = MAX_PACKAGE_SIZE; i < e.target.result.length; i += MAX_PACKAGE_SIZE) {
              if (i + MAX_PACKAGE_SIZE < appsData.length) {
                sendList.push(e.target.result.substr(i, MAX_PACKAGE_SIZE));
              } else {
                sendList.push(e.target.result.substr(i));
              }
            }
          }
        }
      } else {
        jsonCmd.result = RS_ERROR.CONTACT_NOCONTACTPIC;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETCONTACTPIC;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('ContactHelper.js getContactPicById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function removeContactById(jsonCmd, sendCallback, recvList) {
  try {
    var options = {
      filterBy: ['id'],
      filterOp: 'equals',
      filterValue: recvList[0]
    };
    var findRequest = window.navigator.mozContacts.find(options);
    findRequest.onsuccess = function(e) {
      if (e.target.result.length == 0) {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      } else {
        var request = window.navigator.mozContacts.remove(e.target.result[0]);
        request.onsuccess = function(e) {
          jsonCmd.result = RS_OK;
          jsonCmd.smallDatalength = 0;
          jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, null);
        }
        request.onerror = function() {
          jsonCmd.result = RS_ERROR.CONTACT_REMOVECONTACT;
          jsonCmd.smallDatalength = 0;
          jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, null);
        };
      }
    };
    findRequest.onerror = function() {
      console.log('pcsync contact.js line108');
      jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
      jsonCmd.smallDatalength = 0;
      jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
  } catch (e) {
    console.log('ContactHelper.js removeContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function updateContactById(jsonCmd, sendCallback, sendList, recvList) {
  var contactData = recvList.shift();
  var lastDatalen = jsonCmd.datalength - contactData.length;
  doUpdate(jsonCmd, sendCallback, sendList, recvList, contactData, lastDatalen);
}

function doUpdate(jsonCmd, sendCallback, sendList, recvList, contactData, remainder) {
  try {
    if (remainder > 0) {
      if (recvList.length > 0) {
        var recvData = recvList.shift();
        contactData = contactData + recvData;
        remainder = remainder - recvData.length;
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
        if (e.target.result.length == 0) {
          jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
          jsonCmd.smallDatalength = 0;
          jsonCmd.largeDatalength = 0;
          sendCallback(jsonCmd, null);
        } else {
          var updateContact = e.target.result[0];
          for (var uname in newContact) {
            updateContact[uname] = newContact[uname];
          }
          var saveRequest = window.navigator.mozContacts.save(updateContact);
          saveRequest.onsuccess = function() {
            jsonCmd.result = RS_OK;

            var savedContact = JSON.stringify(updateContact);
            jsonCmd.smallDatalength = savedContact.length;
            jsonCmd.largeDatalength = 0;
            if (savedContact.length <= MAX_PACKAGE_SIZE) {
              sendCallback(jsonCmd, savedContact);
            } else {
              sendCallback(jsonCmd, savedContact.substr(0, MAX_PACKAGE_SIZE));
              for (var i = MAX_PACKAGE_SIZE; i < savedContact.length; i += MAX_PACKAGE_SIZE) {
                if (i + MAX_PACKAGE_SIZE < savedContact.length) {
                  sendList.push(savedContact.substr(i, MAX_PACKAGE_SIZE));
                } else {
                  sendList.push(savedContact.substr(i));
                }
              }
            }
          };
          saveRequest.onerror = function() {
            jsonCmd.result = RS_ERROR.CONTACT_SAVECONTACT;
            jsonCmd.smallDatalength = 0;
            jsonCmd.largeDatalength = 0;
            sendCallback(jsonCmd, null);
          };
        }
      };
      request.onerror = function() {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      };
    }
  } catch (e) {
    console.log('ContactHelper.js updateContactById failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}