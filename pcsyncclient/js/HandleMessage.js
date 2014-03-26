/*------------------------------------------------------------------------------------------------------------
 *File Name: HandleMessage.js
 *Created By: dxue@mozilla.com
 *Description: Distribute the recived data to processing module
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function handleMessage(socket, jsonCmd, sendCallback, recvData) {
  switch (jsonCmd.type) {
  case CMD_TYPE.contact:
    {
      contactHelper(socket, jsonCmd, sendCallback, recvData);
      break;
    }
  case CMD_TYPE.deviceInfo:
    {
      deviceInfoHelper(socket, jsonCmd, sendCallback, recvData);
      break;
    }
  case CMD_TYPE.music:
    {
      musicHelper(socket, jsonCmd, sendCallback, recvData);
      break;
    }
  case CMD_TYPE.picture:
    {
      pictureHelper(socket, jsonCmd, sendCallback, recvData);
      break;
    }
  case CMD_TYPE.video:
    {
      videoHelper(socket, jsonCmd, sendCallback, recvData);
      break;
    }
  case CMD_TYPE.listen:
    {
      listenHelper(socket, jsonCmd, sendCallback, recvData);
      break;
    }
  default:
    {
      debug('HandleMessage.js undefined type :' + jsonCmd.type);
      jsonCmd.result = RS_ERROR.TYPE_UNDEFINED;
      sendCallback(socket, jsonCmd, null);
      break;
    }
  }
}