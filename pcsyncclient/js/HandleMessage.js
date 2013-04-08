/*------------------------------------------------------------------------------------------------------------
 *File Name: HandleMessage.js
 *Created By: dxue@mozilla.com
 *Description: Distribute the recived data to processing module
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function handleMessage(socket, jsonCmd, sendCallback, recvList) {
  try {
    switch (jsonCmd.type) {
    case CMD_TYPE.app:
      {
        appManagerHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    case CMD_TYPE.contact:
      {
        contactHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    case CMD_TYPE.deviceInfo:
      {
        deviceInfoHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    case CMD_TYPE.music:
      {
        musicHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    case CMD_TYPE.picture:
      {
        pictureHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    case CMD_TYPE.sms:
      {
        smsHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    case CMD_TYPE.video:
      {
        videoHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    case CMD_TYPE.file:
      {
        fileHelper(socket,jsonCmd, sendCallback,  recvList);
        break;
      }
    default:
      {
        console.log('HandleMessage.js undefined type :' + jsonCmd.type);
        jsonCmd.result = RS_ERROR.TYPE_UNDEFINED;
        jsonCmd.firstDatalength = 0;
        jsonCmd.secondDatalength = 0;
        sendCallback(socket,jsonCmd, null,null);
        break;
      }
    }
  } catch (e) {
    console.log('HandleMessage.js handleMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.firstDatalength = 0;
    jsonCmd.secondDatalength = 0;
    sendCallback(socket,jsonCmd, null,null);
  }
}