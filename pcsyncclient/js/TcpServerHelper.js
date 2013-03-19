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
        message = JSON.parse(message);
        this.exDataLength = message.exdatalength;
        if (this.exDataLength == 0) {
          this.isNewCmd = true;
        } else {
          this.isNewCmd = false;
        }
        handleMessage(message, this.sendCmdData.bind(this), this.sendList, this.recvList);
      } else {
        this.recvList.push(message);
        this.exDataLength = this.exDataLength - message.length;
        if (this.exDataLength <= 0) {
          this.isNewCmd = true;
        }
      }
    } catch (e) {
      debug('TcpServerHelper.js onData failed: ' + e);
    }
  },

  onDrain: function(event) {
    debug('TcpServerHelper.js onDrain');
  },

  onError: function(event) {
    debug('TcpServerHelper.js onError');
  },

  onClose: function(event) {
    debug('TcpServerHelper.js onClose');
  },

  sendQueueData: function(value) {
    try {
      var sendLength = value;
      if (sendLength > 0) {
        if (this.sendList.length > 0) {
          var message = TextEncoder('utf-8').encode(this.sendList[0]);
          this.socket.send(message);
          sendLength = sendLength - this.sendList[0].length;
          this.sendList.remove(0);
          if (sendLength > 0) {
            setTimeout(this.sendQueueData(sendLength).bind(this));
          }
        } else {
          setTimeout(this.sendQueueData(sendLength).bind(this), 20);
        }
      }
    } catch (e) {
      debug('TcpServerHelper.js sendQueueData failed: ' + e);
    }
  },

  sendCmdData: function(jsonCmd) {
    try {
      var message = TextEncoder('utf-8').encode(JSON.stringify(jsonCmd));
      this.socket.send(message);
      if (jsonCmd.exdatalength > 0) {
        this.sendQueueData(jsonCmd.exdatalength).bind(this);
      }
    } catch (e) {
      debug('TcpServerHelper.js sendCmdData failed: ' + e);
    }
  }
};