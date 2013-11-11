/*------------------------------------------------------------------------------------------------------------
 *File Name: ContactHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage contact
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function contactHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    switch (jsonCmd.command) {
    case CONTACT_COMMAND.addContact:
      {
        addContact(socket, jsonCmd, sendCallback, recvData);
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
        getContactById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case CONTACT_COMMAND.getContactByPhoneNumber:
      {
        getContactByPhoneNumber(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case CONTACT_COMMAND.removeContactById:
      {
        removeContactById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    case CONTACT_COMMAND.updateContactById:
      {
        updateContactById(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    default:
      {
        debug('ContactHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('ContactHelper.js contactHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function addContact(socket, jsonCmd, sendCallback, recvData) {
  var contactData = recvData;
  var newContact = new mozContact();
  debug('ContactHelper.js addContact contactData is: ' + contactData);
  var jsonContact = JSON.parse(contactData)
  newContact.init(jsonContact);
  if (jsonContact.photo.length > 0) {
    newContact.photo = [dataUri2Blob(jsonContact.photo)];
  }
  var saveRequest = window.navigator.mozContacts.save(newContact);
  saveRequest.onsuccess = function() {
    jsonCmd.result = RS_OK;
    var foundContact = JSON.stringify(newContact.id);
    sendCallback(socket, jsonCmd, foundContact);
  };
  saveRequest.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_ADDCONTACT;
    sendCallback(socket, jsonCmd, null);
  };
}

function clearAllContacts(socket, jsonCmd, sendCallback) {
  var request = window.navigator.mozContacts.clear();
  request.onsuccess = function() {
    jsonCmd.result = RS_OK;
    sendCallback(socket, jsonCmd, null);
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_CLEARALLCONTACTS;
    sendCallback(socket, jsonCmd, null);
  };
}

function getAllContacts(socket, jsonCmd, sendCallback) {
  debug('ContactHelper.js getAllContacts');
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
        url: contact.url,
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
      } else {
        chunk.push(contactJson);
        request.continue();
      }
    } else {
      jsonCmd.result = RS_OK;
      var contactsData = JSON.stringify(chunk);
      debug('ContactHelper.js getAllContacts contactsData: ' + contactsData);
      sendCallback(socket, jsonCmd, contactsData);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_GETALLCONTACTS;
    sendCallback(socket, jsonCmd, null);
  };
}

function getContactById(socket, jsonCmd, sendCallback, recvData) {
  var contactData = recvData;
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: contactData
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(evt) {
    debug('ContactHelper.js getContactById e.target.result: ' + evt.target.result.length);
    if (evt.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
      return;
    }
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
      url: contact.url,
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
        sendCallback(socket, jsonCmd, contactData);
      }
    } else {
      jsonCmd.result = RS_OK;
      var contactData = JSON.stringify(contactJson);
      sendCallback(socket, jsonCmd, contactData);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
    sendCallback(socket, jsonCmd, null);
  };
}

function getContactByPhoneNumber(socket, jsonCmd, sendCallback, recvData) {
  var contactData = recvData;
  var options = {
    filterBy: ['tel'],
    filterOp: 'match',
    filterValue: contactData.replace(/\s+/g, '')
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(evt) {
    debug('ContactHelper.js getContactByPhoneNumber e.target.result: ' + evt.target.result.length);
    if (evt.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
      return;
    }
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
      url: contact.url,
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
        sendCallback(socket, jsonCmd, contactData);
      }
    } else {
      jsonCmd.result = RS_OK;
      var contactData = JSON.stringify(contactJson);
      sendCallback(socket, jsonCmd, contactData);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
    sendCallback(socket, jsonCmd, null);
  };
}

function removeContactById(socket, jsonCmd, sendCallback, recvData) {
  var contactData = recvData;
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: contactData
  };
  var findRequest = window.navigator.mozContacts.find(options);
  findRequest.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
      return;
    }
    var request = window.navigator.mozContacts.remove(e.target.result[0]);
    request.onsuccess = function(e) {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_REMOVECONTACT;
      sendCallback(socket, jsonCmd, null);
    };
  };
  findRequest.onerror = function() {
    debug('pcsync contact.js line108');
    jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
    sendCallback(socket, jsonCmd, null);
  };
}

function updateContactById(socket, jsonCmd, sendCallback, recvData) {
  var contactData = recvData;
  var newContact = JSON.parse(contactData);
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: newContact.id
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
      return;
    }
    var updateContact = e.target.result[0];
    for (var uname in newContact) {
      if (uname == 'photo' && newContact.photo.length > 0) {
        updateContact.photo = [dataUri2Blob(newContact.photo)];
      } else if (uname in updateContact) {
        updateContact[uname] = newContact[uname];
      }
    }
    var saveRequest = window.navigator.mozContacts.save(updateContact);
    saveRequest.onsuccess = function() {
      jsonCmd.result = RS_OK;
      var savedContact = JSON.stringify(updateContact);
      sendCallback(socket, jsonCmd, savedContact);
    };
    saveRequest.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_SAVECONTACT;
      sendCallback(socket, jsonCmd, null);
    };
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
    sendCallback(socket, jsonCmd, null);
  };
}