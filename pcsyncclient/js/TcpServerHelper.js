/*------------------------------------------------------------------------------------------------------------
 *File Name: TcpServerHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage TCP socket connection
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function tcpServerHelper(socket) {
  this.socket = socket;
  this.isNewCmd = true;
  this.recvList = new Array();
  this.jsonCmd = null;
  this.firstData = null;
  this.lastRecvLength = 0;
  this.socket.ondata = this.onData.bind(this);
  this.socket.ondrain = this.onDrain.bind(this);
  this.socket.onerror = this.onError.bind(this);
  this.socket.onclose = this.onClose.bind(this);
}

tcpServerHelper.prototype = {

  onData: function(event) {
    try {
      console.log('TcpServerHelper.js event.data.length : ' + event.data.length);
      if (this.isNewCmd) {
        var datalen = event.data.length;
        if (datalen >= TITLE_SIZE) {
          this.jsonCmd = titleArray2Json(event.data);
          if (this.jsonCmd != null) {
            if (this.jsonCmd.datalength > 0) {
              datalen -= TITLE_SIZE;
              console.log('TcpServerHelper.js datalen : ' + datalen);
              this.lastRecvLength = this.jsonCmd.datalength - datalen;
              if (this.lastRecvLength > 0) {
                this.isNewCmd = false;
              }
              if (this.jsonCmd.firstDatalength > 0) {
                console.log('TcpServerHelper.js this.jsonCmd.firstDatalength : ' + this.jsonCmd.firstDatalength);
                this.firstData = new Uint8Array(this.jsonCmd.firstDatalength);
                if (datalen >= this.jsonCmd.firstDatalength) {
                  this.firstData.set(event.data.subarray(TITLE_SIZE, TITLE_SIZE + this.jsonCmd.firstDatalength), 0);
                  var message = TextDecoder('utf-8').decode(this.firstData);
                  this.recvList.push(message);
                  handleMessage(this.socket, this.jsonCmd, sendCmdAndData,  this.recvList);
                } else {
                  this.firstData.set(event.data.subarray(TITLE_SIZE, event.data.length), 0);
                }
              } else {
                this.recvList.push(event.data.subarray(TITLE_SIZE, event.data.length));
                handleMessage(this.socket, this.jsonCmd, sendCmdAndData,  this.recvList);
              }
            } else {
              handleMessage(this.socket, this.jsonCmd, sendCmdAndData, this.recvList);
            }
          }
        } else {
          //ignore length < TITLE_SIZE data
        }
      } else {
        console.log('TcpServerHelper.js lastRecvLength : ' + this.lastRecvLength);
        if (this.lastRecvLength > this.jsonCmd.secondDatalength) {
          if ((this.lastRecvLength - event.data.length) > this.jsonCmd.secondDatalength) {
            this.firstData.set(event.data, this.jsonCmd.datalength - this.lastRecvLength);
          } else {
            this.firstData.set(event.data.subarray(0, this.lastRecvLength - this.jsonCmd.secondDatalength), this.jsonCmd.datalength - this.lastRecvLength);
            var message = TextDecoder('utf-8').decode(this.firstData);
            this.recvList.push(message);
            handleMessage(this.socket, this.jsonCmd, sendCmdAndData.bind(this),  this.recvList);
          }
        } else {
          this.recvList.push(event.data);
        }
        this.lastRecvLength = this.lastRecvLength - event.data.length;
        if (this.lastRecvLength <= 0) {
          this.isNewCmd = true;
        }
      }
      console.log('TcpServerHelper.js onData return');
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

function sendCmdAndData(socket, jsonCmd, firstData, secondData) {
  try {
    if (jsonCmd != null) {
      var sendData = null;
      jsonCmd.datalength = jsonCmd.firstDatalength + jsonCmd.secondDatalength;
      console.log('TcpServerHelper.js jsonCmd: ' + JSON.stringify(jsonCmd));
      if (jsonCmd.datalength == 0) {
        sendData = json2TitleArray(jsonCmd);
      } else {
        if (jsonCmd.firstDatalength > 0) {
          if (firstData != null) {
            sendData = jsonAndFirstData2Array(jsonCmd, firstData);
          } else {
            sendData = json2TitleArray(jsonCmd);
          }
        } else {
          if (secondData != null) {
            sendData = jsonAndSecondData2Array(jsonCmd, secondData);
          } else {
            sendData = json2TitleArray(jsonCmd);
          }
        }
      }
    } else {
      if (firstData != null) {
        sendData = string2Utf8Array(firstData);
      }
      if (secondData != null) {
        sendData = secondData;
      }
    }
    if (sendData != null) {
      console.log('TcpServerHelper.js sendData: ' + sendData);
      socket.send(sendData);
    }
  } catch (e) {
    console.log('TcpServerHelper.js sendCmdData failed: ' + e);
  }
}