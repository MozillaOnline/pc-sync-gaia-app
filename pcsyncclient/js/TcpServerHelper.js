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
  this.lastRecvLength = 0;
  this.lastSendLength = 0;
  this.socket.ondata = this.onData.bind(this);
  this.socket.ondrain = this.onDrain.bind(this);
  this.socket.onerror = this.onError.bind(this);
  this.socket.onclose = this.onClose.bind(this);
}

tcpServerHelper.prototype = {

  onData: function(event) {
    try {
      if (this.isNewCmd) {
        if (event.data.length >= TITLE_SIZE) {
          var jsonCmd = titleArray2Json(event.data);
          console.log('tcpServerHelper.js jsonCmd is: ' + JSON.stringify(jsonCmd));
          if (jsonCmd.datalength != 0) {
            this.isNewCmd = false;
          }
          this.lastRecvLength = jsonCmd.datalength;
          if (event.data.length > TITLE_SIZE) {
            var message = TextDecoder('utf-8').decode(createNewArray(event.data.subarray(TITLE_SIZE, event.data.length)));
            console.log('tcpServerHelper.js message is: ' + message);
            this.recvList.push(message);
            this.lastRecvLength = this.lastRecvLength - message.length;
          }
          handleMessage(jsonCmd, sendCmdData.bind(this), this.sendList, this.recvList);
        } else {
          //ignore length < TITLE_SIZE data
        }
      } else {
        var message = TextDecoder('utf-8').decode(createNewArray(event.data));
        this.recvList.push(message);
        this.lastRecvLength = this.lastRecvLength - message.length;
        if (this.lastRecvLength <= 0) {
          this.isNewCmd = true;
        }
      }
    } catch (e) {
      console.log('TcpServerHelper.js onData failed: ' + e);
    }
  },

  onDrain: function(event) {
    console.log('TcpServerHelper.js onDrain');
    if (this.lastSendLength > 0) {
      sendQueueData(this.socket, this.lastSendLength, this.sendList);
    }
  },

  onError: function(event) {
    console.log('TcpServerHelper.js onError');
  },

  onClose: function(event) {
    console.log('TcpServerHelper.js onClose');
  }
};

function sendQueueData(socket, value, sendList) {
  try {
    if (value > 0) {
      if (sendList.length > 0) {
        var dataString = sendList.shift();
        var dataArray = string2Utf8Array(dataString);
        socket.send(dataArray);
        value = value - dataString.length;

      } else {
        setTimeout(function() {
          sendQueueData(socket, value, sendList);
        }, 20);
      }
    }
  } catch (e) {
    console.log('TcpServerHelper.js sendQueueData failed: ' + e);
  }
}

function sendCmdData(jsonCmd, data) {
  try {
    var sendData = null;
    jsonCmd.datalength = jsonCmd.smallDatalength + jsonCmd.largeDatalength;
    console.log('TcpServerHelper.js jsonCmd: ' + JSON.stringify(jsonCmd));
    if (jsonCmd.datalength == 0) {
      sendData = json2TitleArray(jsonCmd);
      console.log('TcpServerHelper.js sendData: ' + sendData);
      this.socket.send(sendData);
    } else {
      sendData = jsonAndData2Array(jsonCmd, data);
      console.log('TcpServerHelper.js sendData: ' + sendData);
      this.socket.send(sendData);
      this.lastSendLength = jsonCmd.datalength - data.length
    }
  } catch (e) {
    console.log('TcpServerHelper.js sendCmdData failed: ' + e);
  }
}