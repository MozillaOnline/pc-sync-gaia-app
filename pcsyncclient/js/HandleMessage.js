/*------------------------------------------------------------------------------------------------------------
 *File Name: HandleMessage.js
 *Created By: dxue@mozilla.com
 *Description: Distribute the recived data to processing module
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function handleMessage(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.type) {
    case CMD_TYPE.app:
      {
        appManagerHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CMD_TYPE.contact:
      {
        contactHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CMD_TYPE.deviceInfo:
      {
        deviceInfoHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CMD_TYPE.music:
      {
        musicHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CMD_TYPE.picture:
      {
        pictureHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CMD_TYPE.sms:
      {
        smsHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case CMD_TYPE.video:
      {
        videoHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    default:
      {
        console.log('HandleMessage.js undefined type :' + jsonCmd.type);
        jsonCmd.result = RS_ERROR.TYPE_UNDEFINED;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('HandleMessage.js handleMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}