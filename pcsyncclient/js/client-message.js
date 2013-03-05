function Client_message(socket) {
  debug('pcsync client-message.js line2 :' + socket);
  this.acceptsock = socket;
}

Client_message.prototype = {
  printArray: function(array) {
    var value = [];

    for (var i = 0; i < array.length; i++) {
      value[i] = array[i];
    }

    debug(value.join(','))
  },

  createNewArray: function(array) {
    var newArray = Uint8Array(array.length);

    for (var i = 0; i < array.length; i++) {
      newArray[i] = array[i];
    }

    return newArray;
  },

  handleMessage: function (data){
    var message = null;
    try {
      // Have to create a new array, or an error will be thrown:
      //   Value does not implement interface ArrayBufferView
      message = TextDecoder('utf-8').decode(this.createNewArray(data));
    } catch (e) {
      return;
    }

    debug('pcsync client-message.js line11 :' + JSON.stringify(message));
    try {
      message = JSON.parse(message);
    } catch (e) {
      debug('pcsync client-message.js line16 :' + data);
      return;
    }
    switch (message.action) {
      case "request":
        this.requestmessage(message);
        break;
      case "response":
        this.responsemessage(message);
        break;
      default:
        debug('pcsync client-message.js line27 :' + data);
        break;
    }
  },

  send: function(data) {
    debug('Send back data: ' + data);
    this.acceptsock.send(TextEncoder('utf-8').encode(data));
  },

  requestmessage: function (data){
    switch (data.target) {
      case "contact":
        debug('pcsync client-message.js line35 :' + this.acceptsock);
        Action_contact.init(this);
        Action_contact.request(data);
        break;
      case "sms":
        Action_sms.init(this);
        Action_sms.request(data);
        break;
      case "device":
        Action_device.init(this);
        Action_device.request(data);
        break;
    case "pictures":
        Action_pictures.init(this.acceptsock);
        Action_pictures.request(data);
        break;
    case "videos":
        Action_videos.init(this.acceptsock);
        Action_videos.request(data);
        break;
      default:
        debug('pcsync client-message.js line43 :' + data);
        break;
    }
  },

  responsemessage: function (data){
    switch (data.target) {
      default:
        debug('pcsync client-message.js line51 :' + data);
        break;
    }
  }
};

