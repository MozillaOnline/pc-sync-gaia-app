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
    case "contact":
      {
        contactHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "deviceInfo":
      {
        deviceInfoHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "sms":
      {
        smsHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "app":
      {
        appManagerHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "picture":
      {
        pictureHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "video":
      {
        videoHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    case "music":
      {
        musicHelper(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    default:
      {
        debug('HandleMessage.js undefined type :' + jsonCmd.type);
        jsonCmd.result = RS_ERROR.TYPE_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('HandleMessage.js handleMessage failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}