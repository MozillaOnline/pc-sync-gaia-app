'use strict';

(function(exports) {

var ContactHandler = function(app) {
  this.app = app;
  console.log("ContactHandler init!");
  navigator.mozContacts.oncontactchange = null;
  document.addEventListener(CMD_TYPE.app_disconnect,
                            this.reset.bind(this));
  document.addEventListener(CMD_TYPE.contact_add,
                            this.addContact.bind(this));
  document.addEventListener(CMD_TYPE.contact_getAll,
                            this.getAllContacts.bind(this));
  document.addEventListener(CMD_TYPE.contact_getById,
                            this.getContactById.bind(this));
  document.addEventListener(CMD_TYPE.contact_removeById,
                            this.removeContactById.bind(this));
  document.addEventListener(CMD_TYPE.contact_updateById,
                            this.updateContactById.bind(this));

  // After editing some contact, whether notify app on PC side.
  this.enableListening = false;
  // Listening for contact changing.
  navigator.mozContacts.oncontactchange = function(event) {
    var responseCmd = {
      id: 0,
      flag: 0,
      datalength: 0
    };
    switch (event.reason) {
      case 'remove':
        responseCmd.id = CMD_ID.listen_contact_delete;
        responseCmd.flag = CMD_TYPE.contact_removeById;
        break;
      case 'update':
        responseCmd.id = CMD_ID.listen_contact_update;
        responseCmd.flag = CMD_TYPE.contact_updateById;
        break;
      case 'create':
        responseCmd.id = CMD_ID.listen_contact_create;
        responseCmd.flag = CMD_TYPE.contact_add;
        break;
      default:
        return;
    }
    if (this.enableListening) {
      this.app.serverManager.update(responseCmd, string2Array(event.contactID));
    }
  }.bind(this);
};

ContactHandler.prototype.reset = function() {
  this.enableListening = false;
};

ContactHandler.prototype.addContact = function(e) {
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.contact_add,
    datalength: 0
  };
  var contact = new mozContact();
  var contactData = array2String(e.detail.data);
  var contactObj = JSON.parse(contactData);

  if (contactObj.photo != null && contactObj.photo.length > 0) {
    contactObj.photo = [dataUri2Blob(contactObj.photo)];
  }
  contact.init(contactObj);

  var req = window.navigator.mozContacts.save(contact);
  req.onsuccess = function() {
    var id = JSON.stringify(contact.id);
    this.app.serverManager.send(cmd, string2Array(id));
  }.bind(this);

  req.onerror = function() {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.CONTACT_ADDCONTACT));
  }.bind(this);
};

ContactHandler.prototype.getAllContacts = function(e) {
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.contact_getAll,
    datalength: 0
  };
  this.enableListening = true;
  var contacts = [];

  var request = window.navigator.mozContacts.getAll({});
  request.onsuccess = function(evt) {
    var contact = evt.target.result;
    if (!contact) {
      this.app.serverManager.send(cmd, string2Array(JSON.stringify(contacts)));
      return;
    }
    
    var contactObj = {
      id: contact.id,
      photo: [],
      name: contact.name,
      givenName: contact.givenName,
      familyName: contact.familyName,
      additionalName: contact.additionalName,
      nickname: contact.nickname,
      email: contact.email,
      url: contact.url,
      category: contact.category,
      adr: contact.adr,
      tel: contact.tel,
      org: contact.org,
      jobTitle: contact.jobTitle,
      note: contact.note,
      sex: contact.sex
    };

    if (contact.photo != null && contact.photo.length > 0) {
      var fr = new FileReader();
      fr.readAsDataURL(contact.photo[0]);
      fr.onload = function(e) {
        contactObj.photo = e.target.result;
        contacts.push(contactObj);
        request.continue();
      }.bind(this);
    } else {
      contacts.push(contactObj);
      request.continue();
    }
  }.bind(this);

  request.onerror = function() {
    this.app.serverManager.send(cmd,
                                int2Array(RS_ERROR.CONTACT_GETALLCONTACTS));
  }.bind(this);
};

ContactHandler.prototype.getContactById = function(e) {
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: array2String(e.detail.data)
  };
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.contact_getById,
    datalength: 0
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(evt) {
    if (evt.target.result.length == 0) {
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.CONTACT_GETCONTACT));
      return;
    }
    var contact = evt.target.result[0];
    var contactObj = {
      id: contact.id,
      photo: [],
      name: contact.name,
      givenName: contact.givenName,
      familyName: contact.familyName,
      additionalName: contact.additionalName,
      nickname: contact.nickname,
      email: contact.email,
      url: contact.url,
      category: contact.category,
      adr: contact.adr,
      tel: contact.tel,
      org: contact.org,
      jobTitle: contact.jobTitle,
      note: contact.note,
      sex: contact.sex
    };

    if (contact.photo != null && contact.photo.length > 0) {
      var fr = new FileReader();
      fr.readAsDataURL(contact.photo[0]);
      fr.onload = function(e) {
        contactObj.photo = e.target.result;
        this.app.serverManager.send(cmd,
                                    string2Array(JSON.stringify(contactObj)));
      }.bind(this);
      return;
    }
    this.app.serverManager.send(cmd, string2Array(JSON.stringify(contactObj)));
  }.bind(this);

  request.onerror = function() {
    this.app.serverManager.send(cmd, int2Array(RS_ERROR.CONTACT_GETCONTACT));
  }.bind(this);
};

ContactHandler.prototype.removeContactById = function(e) {
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: array2String(e.detail.data)
  };
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.contact_removeById,
    datalength: 0
  };
  var req = window.navigator.mozContacts.find(options);
  req.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      this.app.serverManager.send(cmd, int2Array(RS_OK));
      return;
    }
    var request = window.navigator.mozContacts.remove(e.target.result[0]);
    request.onsuccess = function(e) {
      this.app.serverManager.send(cmd, int2Array(RS_OK));
    }.bind(this);

    request.onerror = function() {
      this.app.serverManager.send(cmd,
                                  int2Array(RS_ERROR.CONTACT_REMOVECONTACT));
    }.bind(this);
  }.bind(this);

  req.onerror = function() {
    this.app.serverManager.send(cmd,
                                int2Array(RS_ERROR.CONTACT_CONTACT_NOTFOUND));
  }.bind(this);
};

ContactHandler.prototype.updateContactById = function(e) {
  var newContact = JSON.parse(array2String(e.detail.data));
  var options = {
    filterBy: ['id'],
    filterOp: 'equals',
    filterValue: newContact.id
  };
  var cmd = {
    id: e.detail.id,
    flag: CMD_TYPE.contact_updateById,
    datalength: 0
  };
  var request = window.navigator.mozContacts.find(options);
  request.onsuccess = function(e) {
    if (e.target.result.length == 0) {
      this.app.serverManager.send(cmd, int2Array(RS_OK));
      return;
    }
    var contact = e.target.result[0];
    var itemList = ['id', 'photo', 'name',
                    'givenName', 'familyName', 'additionalName',
                    'nickname', 'email', 'url',
                    'category', 'adr', 'tel',
                    'org', 'jobTitle', 'note', 'sex'];
    for (var i = 0; i < itemList.length; i ++) {
      if (itemList[i] == 'photo' && newContact.photo.length > 0) {
        contact.photo = [dataUri2Blob(newContact.photo)];
      } else {
        contact[itemList[i]] = newContact[itemList[i]];
      }
    }

    var req = window.navigator.mozContacts.save(contact);
    req.onsuccess = function() {
      this.app.serverManager.send(cmd, string2Array(JSON.stringify(contact)));
    }.bind(this);

    req.onerror = function() {
      this.app.serverManager.send(cmd, int2Array(RS_ERROR.CONTACT_SAVECONTACT));
    }.bind(this);
  }.bind(this);

  request.onerror = function() {
    this.app.serverManager.send(cmd,
                                int2Array(RS_ERROR.CONTACT_CONTACT_NOTFOUND));
  }.bind(this);
};

exports.ContactHandler = ContactHandler;

})(window);
