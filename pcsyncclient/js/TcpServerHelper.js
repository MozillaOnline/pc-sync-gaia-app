/*------------------------------------------------------------------------------------------------------------
 *File Name: TcpServerHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage TCP socket connection
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function tcpServerHelper(data) {
  this.socket = data;
  this.isNewCmd = true;
  this.sendList = new Array();
  this.recvList = new Array();
  this.exDataLength = 0;
  this.socket.ondata = this.onData.bind(this);
  this.socket.ondrain = this.onDrain.bind(this);
  this.socket.onerror = this.onError.bind(this);
  this.socket.onclose = this.onClose.bind(this);
}

tcpServerHelper.prototype = {

  onData: function(event) {
    try {
      var message = TextDecoder('utf-8').decode(createNewArray(event.data));
      if (this.isNewCmd) {
        console.log('tcpServerHelper.js onData is: ' + message);
        message = JSON.parse(message);
        if (message.result == RS_GETEXDATA) {
          sendQueueData(this.socket, message.exdatalength, this.sendList);
        } else {
          this.exDataLength = message.exdatalength;
          console.log('tcpServerHelper.js exDataLength is: ' + this.exDataLength);
          if (this.exDataLength == 0) {
            this.isNewCmd = true;
          } else {            
            var jsonGetExdata = {
              'id': message.id,
              'type': message.type,
              'command': message.command,
              'result': RS_GETEXDATA,
              'data': null,
              'exdatalength': message.exdatalength
            };
            this.socket.send(TextEncoder('utf-8').encode(JSON.stringify(jsonGetExdata)));
            this.isNewCmd = false;
          }
          console.log('tcpServerHelper.js isNewCmd is: ' + this.isNewCmd);
          handleMessage(message, sendCmdData.bind(this), this.sendList, this.recvList);
        }
      } else {
        this.recvList.push(message);
        this.exDataLength = this.exDataLength - message.length;
        if (this.exDataLength <= 0) {
          this.isNewCmd = true;
        }
      }
    } catch (e) {
      console.log('TcpServerHelper.js onData failed: ' + e);
    }
  },

  onDrain: function(event) {
    console.log('TcpServerHelper.js onDrain');
  },

  onError: function(event) {
    console.log('TcpServerHelper.js onError');
  },

  onClose: function(event) {
    console.log('TcpServerHelper.js onClose');
  }
};

function sendCmdData(jsonCmd) {
  try {
    var message = TextEncoder('utf-8').encode(JSON.stringify(jsonCmd));
    this.socket.send(message);
    this.isNewCmd = true;
  } catch (e) {
    console.log('TcpServerHelper.js sendCmdData failed: ' + e);
  }
}

function sendQueueData(socket, value, sendList) {
  try {
    var sendLength = value;
    if (sendLength > 0) {
      if (sendList.length > 0) {
        var message = TextEncoder('utf-8').encode(sendList[0]);
        socket.send(message);
        sendLength = sendLength - sendList[0].length;
        sendList.remove(0);
        if (sendLength > 0) {
          setTimeout(function() {
            sendQueueData(socket, sendLength, sendList);
          }, 0);
        }
      } else {
        setTimeout(function() {
          sendQueueData(socket, sendLength, sendList);
        }, 20);
      }
    }
  } catch (e) {
    console.log('TcpServerHelper.js sendQueueData failed: ' + e);
  }
}