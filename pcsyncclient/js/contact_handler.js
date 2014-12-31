'use strict';

(function(exports) {

var ContactHandler = function(app) {
  this.app = app;
  this.enableListening = false;
  this.started = false;
};

ContactHandler.prototype.start = function() {
  if (this.started) {
    console.log('ContactHandler is running.');
    return;
  }

  this.started = true;

  // Listening for contact changing.
  navigator.mozContacts.oncontactchange = function(event) {
    var responseCmd = {
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

    var responseData = JSON.stringify(contactMessage);
    if (this.enableListening) {
      this.sendUpdated(responseCmd, responseData);
    }
  }.bind(this);
};

ContactHandler.prototype.stop = function() {
  if (!this.started) {
    console.warn('ContactHandler has been stopped.');
    return;
  }

  this.started = false;
  navigator.mozContacts.oncontactchange = null;
  this.enableListening = false;
};

ContactHandler.prototype.handleMessage = function(cmd, data) {
  try {
    switch (cmd.command) {
      case CONTACT_COMMAND.addContact:
        this.addContact(cmd, data);
        break;
      case CONTACT_COMMAND.clearAllContacts:
        this.clearAllContacts(cmd);
        break;
      case CONTACT_COMMAND.getAllContacts:
        this.getAllContacts(cmd);
        break;
      case CONTACT_COMMAND.getContactById:
        this.getContactById(cmd, data);
        break;
      case CONTACT_COMMAND.getContactByPhoneNumber:
        this.getContactByPhoneNumber(cmd, data);
        break;
      case CONTACT_COMMAND.removeContactById:
        this.removeContactById(cmd, data);
        break;
      case CONTACT_COMMAND.updateContactById:
        this.updateContactById(cmd, data);
        break;
      default:
        cmd.result = RS_ERROR.COMMAND_UNDEFINED;
        this.send(cmd, null);
        break;
    }
  } catch(e) {
    cmd.result = RS_ERROR.UNKNOWEN;
    this.send(cmd, null);
  }
};

ContactHandler.prototype.addContact = function(cmd, data) {
  var contact = new mozContact();
  var jsonContact = JSON.parse(array2String(data));

  if (jsonContact.photo.length > 0) {
    jsonContact.photo = [dataUri2Blob(jsonContact.photo)];
  }
  contact.init(jsonContact);

  var req = window.navigator.mozContacts.save(contact);
  req.onsuccess = function() {
    cmd.result = RS_OK;
    var id = JSON.stringify(contact.id);
    this.send(cmd, id);
  }.bind(this);

  req.onerror = function() {
    cmd.result = RS_ERROR.CONTACT_ADDCONTACT;
    this.send(cmd, null);
  }.bind(this);
};

ContactHandler.prototype.clearAllContacts = function(cmd) {
  var req = window.navigator.mozContacts.clear();
  req.onsuccess = function() {
    cmd.result = RS_OK;
    this.send(cmd, null);
  }.bind(this);

  req.onerror = function() {
    cmd.result = RS_ERROR.CONTACT_CLEARALLCONTACTS;
    this.send(cmd, null);
  }.bind(this);
};

ContactHandler.prototype.getAllContacts = function(cmd) {
  this.enableListening = true;
  var chunk = [];
  var request = window.navigator.mozContacts.getAll({});
  request.onsuccess = function(evt) {
    var contact = evt.target.result;
    if (!contact) {
      cmd.result = RS_OK;
      var contactsData = JSON.stringify(chunk);
      this.send(cmd, contactsData);
      return;
    }

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

    if (evt.target.result.photo != null && evt.target.result.photo.length > 0) {
      var fr = new FileReader();
      fr.readAsDataURL(evt.target.result.photo[0]);
      fr.onload = function(e) {
        contactJson.photo = e.target.result;
        chunk.push(contactJson);
        request.continue();
      }.bind(this);
    } else {
      chunk.push(contactJson);
      request.continue();
    }
  }.bind(this);

  request.onerror = function() {
    cmd.result = RS_ERROR.CONTACT_GETALLCONTACTS;
    this.send(cmd, null);
  }.bind(this);
};

ContactHandler.prototype.getContactById = function(cmd, data) {
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: array2String(data)
  };

  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(evt) {
    if (evt.target.result.length == 0) {
      cmd.result = RS_OK;
      this.send(cmd, null);
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
    if (evt.target.result[0].photo != null &&
        evt.target.result[0].photo.length > 0) {
      var fr = new FileReader();
      fr.readAsDataURL(evt.target.result[0].photo[0]);
      fr.onload = function(e) {
        contactJson.photo = e.target.result;
        cmd.result = RS_OK;
        var contactData = JSON.stringify(contactJson);
        this.send(cmd, contactData);
      }.bind(this);
    } else {
      cmd.result = RS_OK;
      var contactData = JSON.stringify(contactJson);
      this.send(cmd, contactData);
    }
  }.bind(this);

  request.onerror = function() {
    cmd.result = RS_ERROR.CONTACT_GETCONTACT;
    this.send(cmd, null);
  }.bind(this);
};

ContactHandler.prototype.getContactByPhoneNumber = function(cmd, data) {
  var options = {
    filterBy: ['tel'],
    filterOp: 'match',
    filterValue: array2String(data).replace(/\s+/g, '')
  };

  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(evt) {
    if (evt.target.result.length == 0) {
      cmd.result = RS_OK;
      this.send(cmd, null);
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

    if (evt.target.result[0].photo != null &&
        evt.target.result[0].photo.length > 0) {
      var fileReader = new FileReader();
      fileReader.readAsDataURL(evt.target.result[0].photo[0]);
      fileReader.onload = function(e) {
        contactJson.photo = e.target.result;
        cmd.result = RS_OK;
        var contactData = JSON.stringify(contactJson);
        this.send(cmd, contactData);
      }.bind(this);
    } else {
      cmd.result = RS_OK;
      var contactData = JSON.stringify(contactJson);
      this.send(cmd, contactData);
    }
  }.bind(this);

  request.onerror = function() {
    cmd.result = RS_ERROR.CONTACT_GETCONTACT;
    this.send(cmd, null);
  }.bind(this);
};

ContactHandler.prototype.removeContactById = function(cmd, data) {
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: array2String(data)
  };

  var req = window.navigator.mozContacts.find(options);
  req.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      cmd.result = RS_OK;
      this.send(cmd, null);
      return;
    }
    var request = window.navigator.mozContacts.remove(e.target.result[0]);
    request.onsuccess = function(e) {
      cmd.result = RS_OK;
      this.send(cmd, null);
    }.bind(this);

    request.onerror = function() {
      cmd.result = RS_ERROR.CONTACT_REMOVECONTACT;
      this.send(cmd, null);
    }.bind(this);
  }.bind(this);

  req.onerror = function() {
    cmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
    this.send(cmd, null);
  }.bind(this);
};

ContactHandler.prototype.updateContactById = function(cmd, data) {
  var newContact = JSON.parse(array2String(data));
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: newContact.id
  };

  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      cmd.result = RS_OK;
      this.send(cmd, null);
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

    var req = window.navigator.mozContacts.save(updateContact);
    req.onsuccess = function() {
      cmd.result = RS_OK;
      var savedContact = JSON.stringify(updateContact);
      this.send(cmd, savedContact);
    }.bind(this);

    req.onerror = function() {
      cmd.result = RS_ERROR.CONTACT_SAVECONTACT;
      this.send(cmd, null);
    }.bind(this);
  }.bind(this);

  request.onerror = function() {
    cmd.result = RS_ERROR.CONTACT_CONTACT_NOTFOUND;
    this.send(cmd, null);
  }.bind(this);
};

// Send data from dataSocket.
ContactHandler.prototype.send = function(cmd, data) {
  if (this.app.serverManager.dataSocketWrapper) {
    this.app.serverManager.dataSocketWrapper.send(cmd, data);
  }
};

// Send data from mainSocket.
ContactHandler.prototype.sendUpdated = function(cmd, data) {
  if (this.app.serverManager.mainSocketWrapper) {
    this.app.serverManager.mainSocketWrapper.send(cmd, data);
  }
};

exports.ContactHandler = ContactHandler;

})(window);
