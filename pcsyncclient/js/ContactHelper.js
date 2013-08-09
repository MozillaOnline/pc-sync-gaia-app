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
    case CONTACT_COMMAND.getContactByPhoneNumber:
      {
        getContactByPhoneNumber(socket, jsonCmd, sendCallback, recvList);
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
      newContact.photo = [dataUri2Blob(jsonContact.photo)];
    }
    var saveRequest = window.navigator.mozContacts.save(newContact);
    saveRequest.onsuccess = function() {
      jsonCmd.result = RS_OK;
      var foundContact = JSON.stringify(newContact.id);
      jsonCmd.firstDatalength = foundContact.length;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, foundContact, null);
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
    console.log('ContactHelper.js getAllContacts');
    var orderByLastName = true;
    var sortBy = (orderByLastName === true ? 'familyName' : 'givenName');
    var options = {
      sortBy: sortBy,
      sortOrder: 'ascending'
    };
    var chunk = [];
    var request = window.navigator.mozContacts.getAll({});
    request.onsuccess = function(evt) {
      var contact = evt.target.result;
      if (contact) {
        contactJson = {
          id: contact.id,
          photo: [],
          name: contact.name,
          honorificPrefix: contact.honorificPrefix,
          givenName: contact.givenName,
          familyName: contact.familyName,
          additionalName: contact.additionalName,
          honorificSuffix: contact.honorificSuffix,
          nickname: contact.nickname,
          email: contact.email,
          url:contact.url,
          category: contact.category,
          adr: contact.adr,
          tel: contact.tel,
          org: contact.org,
          jobTitle: contact.jobTitle,
          bday: contact.bday,
          note: contact.note,
          impp: contact.impp,
          anniversary: contact.anniversary,
          sex: contact.sex,
          genderIdentity: contact.genderIdentity
        };
        if ((evt.target.result.photo != null) && (evt.target.result.photo.length > 0)) {
          var fileReader = new FileReader();
          fileReader.readAsDataURL(evt.target.result.photo[0]);
          fileReader.onload = function(e) {
            contactJson.photo = e.target.result;
            chunk.push(contactJson);
            request.continue();
          }
        }else{
          chunk.push(contactJson);
          request.continue();
        }
      } else {
        jsonCmd.result = RS_OK;
        var contactsData = JSON.stringify(chunk);
        jsonCmd.firstDatalength = contactsData.length;
        jsonCmd.secondDatalength = 0;
        console.log('ContactHelper.js getAllContacts contactsData: ' + contactsData);
        sendCallback(socket, jsonCmd, contactsData, null);
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
    request.onsuccess = function(evt) {
      console.log('ContactHelper.js getContactById e.target.result: ' + evt.target.result.length);
      if (evt.target.result.length == 0) {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      } else {
        var contact = evt.target.result[0];
        var contactJson = {
          id: contact.id,
          photo: [],
          name: contact.name,
          honorificPrefix: contact.honorificPrefix,
          givenName: contact.givenName,
          familyName: contact.familyName,
          additionalName: contact.additionalName,
          honorificSuffix: contact.honorificSuffix,
          nickname: contact.nickname,
          email: contact.email,
          url:contact.url,
          category: contact.category,
          adr: contact.adr,
          tel: contact.tel,
          org: contact.org,
          jobTitle: contact.jobTitle,
          bday: contact.bday,
          note: contact.note,
          impp: contact.impp,
          anniversary: contact.anniversary,
          sex: contact.sex,
          genderIdentity: contact.genderIdentity
        };
        if ((evt.target.result[0].photo != null) && (evt.target.result[0].photo.length > 0)) {
          var fileReader = new FileReader();
          fileReader.readAsDataURL(evt.target.result[0].photo[0]);
          fileReader.onload = function(e) {
            contactJson.photo = e.target.result;
            jsonCmd.result = RS_OK;
            var contactData = JSON.stringify(contactJson);
            jsonCmd.firstDatalength = contactData.length;
            jsonCmd.secondDatalength = 0;
            sendCallback(socket, jsonCmd, contactData, null);
          }
        }else{
          jsonCmd.result = RS_OK;
          var contactData = JSON.stringify(contactJson);
          jsonCmd.firstDatalength = contactData.length;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, contactData, null);
        }
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

function getContactByPhoneNumber(socket, jsonCmd, sendCallback, recvList) {
  try {
    var contactData = recvList.shift();
    var options = {
      filterBy: ['tel'],
      filterOp: 'equals',
      filterValue: contactData
    };
    var request = window.navigator.mozContacts.find(options);
    request.onsuccess = function(evt) {
      console.log('ContactHelper.js getContactByPhoneNumber e.target.result: ' + evt.target.result.length);
      if (evt.target.result.length == 0) {
        jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket, jsonCmd, null, null);
      } else {
        var contact = evt.target.result[0];
        var contactJson = {
          id: contact.id,
          photo: [],
          name: contact.name,
          honorificPrefix: contact.honorificPrefix,
          givenName: contact.givenName,
          familyName: contact.familyName,
          additionalName: contact.additionalName,
          honorificSuffix: contact.honorificSuffix,
          nickname: contact.nickname,
          email: contact.email,
          url:contact.url,
          category: contact.category,
          adr: contact.adr,
          tel: contact.tel,
          org: contact.org,
          jobTitle: contact.jobTitle,
          bday: contact.bday,
          note: contact.note,
          impp: contact.impp,
          anniversary: contact.anniversary,
          sex: contact.sex,
          genderIdentity: contact.genderIdentity
        };
        if ((evt.target.result[0].photo != null) && (evt.target.result[0].photo.length > 0)) {
          var fileReader = new FileReader();
          fileReader.readAsDataURL(evt.target.result[0].photo[0]);
          fileReader.onload = function(e) {
            contactJson.photo = e.target.result;
            jsonCmd.result = RS_OK;
            var contactData = JSON.stringify(contactJson);
            jsonCmd.firstDatalength = contactData.length;
            jsonCmd.secondDatalength = 0;
            sendCallback(socket, jsonCmd, contactData, null);
          }
        }else{
          jsonCmd.result = RS_OK;
          var contactData = JSON.stringify(contactJson);
          jsonCmd.firstDatalength = contactData.length;
          jsonCmd.secondDatalength = 0;
          sendCallback(socket, jsonCmd, contactData, null);
        }
      }
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
      jsonCmd.firstDatalength = 0;
      jsonCmd.secondDatalength = 0;
      sendCallback(socket, jsonCmd, null, null);
    };
  } catch (e) {
    console.log('ContactHelper.js getContactByPhoneNumber failed: ' + e);
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
            updateContact.photo = [dataUri2Blob(newContact.photo)];
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
