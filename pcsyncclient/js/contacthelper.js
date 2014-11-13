/*------------------------------------------------------------------------------------------------------------
 *File Name: ContactHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage contact
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function contactHelper(jsonCmd, recvData) {
  try {
    switch (jsonCmd.command) {
    case CONTACT_COMMAND.addContact:
      {
        addContact(jsonCmd, recvData);
        break;
      }
    case CONTACT_COMMAND.clearAllContacts:
      {
        clearAllContacts(jsonCmd);
        break;
      }
    case CONTACT_COMMAND.getAllContacts:
      {
        getAllContacts(jsonCmd);
        break;
      }
    case CONTACT_COMMAND.getContactById:
      {
        getContactById(jsonCmd, recvData);
        break;
      }
    case CONTACT_COMMAND.getContactByPhoneNumber:
      {
        getContactByPhoneNumber(jsonCmd, recvData);
        break;
      }
    case CONTACT_COMMAND.removeContactById:
      {
        removeContactById(jsonCmd, recvData);
        break;
      }
    case CONTACT_COMMAND.updateContactById:
      {
        updateContactById(jsonCmd, recvData);
        break;
      }
    default:
      {
        debug('ContactHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('ContactHelper.js contactHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  }
}

function addContact(jsonCmd, recvData) {
  var contactData = array2String(recvData);
  var newContact = new mozContact();
  debug('ContactHelper.js addContact contactData is: ' + contactData);
  var jsonContact = JSON.parse(contactData);
  if (jsonContact.photo.length > 0) {
    jsonContact.photo = [dataUri2Blob(jsonContact.photo)];
  }
  newContact.init(jsonContact);
  var saveRequest = window.navigator.mozContacts.save(newContact);
  saveRequest.onsuccess = function() {
    jsonCmd.result = RS_OK;
    var foundContact = JSON.stringify(newContact.id);
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, foundContact);
  };
  saveRequest.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_ADDCONTACT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}

function clearAllContacts(jsonCmd) {
  var request = window.navigator.mozContacts.clear();
  request.onsuccess = function() {
    jsonCmd.result = RS_OK;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_CLEARALLCONTACTS;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}

function getAllContacts(jsonCmd) {
  navigator.mozContacts.oncontactchange = function oncontactchange(event) {
    if (!socketWrappers[listenSocket])
      return;
    var listenJsonCmd = {
      id: 0,
      type: CMD_TYPE.listen,
      command: 0,
      result: RS_OK,
      datalength: 0,
      subdatalength: 0
    };
    var contactMessage = {
      type: 'contact',
      contactID: event.contactID,
      reason: event.reason
    };
    listenJsonCmd.result = RS_OK;
    var sendData = JSON.stringify(contactMessage);
    socketWrappers[listenSocket].send(listenJsonCmd, sendData);
  };
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
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, contactsData);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_GETALLCONTACTS;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}

function getContactById(jsonCmd, recvData) {
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: array2String(recvData)
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(evt) {
    debug('ContactHelper.js getContactById e.target.result: ' + evt.target.result.length);
    if (evt.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
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
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, contactData);
      }
    } else {
      jsonCmd.result = RS_OK;
      var contactData = JSON.stringify(contactJson);
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, contactData);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}

function getContactByPhoneNumber(jsonCmd, recvData) {
  var options = {
    filterBy: ['tel'],
    filterOp: 'match',
    filterValue: array2String(recvData).replace(/\s+/g, '')
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(evt) {
    debug('ContactHelper.js getContactByPhoneNumber e.target.result: ' + evt.target.result.length);
    if (evt.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
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
        if (socketWrappers[serverSocket])
          socketWrappers[serverSocket].send(jsonCmd, contactData);
      }
    } else {
      jsonCmd.result = RS_OK;
      var contactData = JSON.stringify(contactJson);
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, contactData);
    }
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_GETCONTACT;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}

function removeContactById(jsonCmd, recvData) {
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: array2String(recvData)
  };
  var findRequest = window.navigator.mozContacts.find(options);
  findRequest.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
      return;
    }
    var request = window.navigator.mozContacts.remove(e.target.result[0]);
    request.onsuccess = function(e) {
      jsonCmd.result = RS_OK;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    };
    request.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_REMOVECONTACT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    };
  };
  findRequest.onerror = function() {
    debug('pcsync contact.js line108');
    jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}

function updateContactById(jsonCmd, recvData) {
  var newContact = JSON.parse(array2String(recvData));
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: newContact.id
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      jsonCmd.result = RS_OK;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
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
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, savedContact);
    };
    saveRequest.onerror = function() {
      jsonCmd.result = RS_ERROR.CONTACT_SAVECONTACT;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
    };
  };
  request.onerror = function() {
    jsonCmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
    if (socketWrappers[serverSocket])
      socketWrappers[serverSocket].send(jsonCmd, null);
  };
}