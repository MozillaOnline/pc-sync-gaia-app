/*------------------------------------------------------------------------------------------------------------
 *File Name: HandleMessage.js
 *Created By: dxue@mozilla.com
 *Description: Distribute the recived data to processing module
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function handleMessage(jsonCmd, recvData) {
  switch (jsonCmd.type) {
  case CMD_TYPE.contact:
    {
      contactHelper(jsonCmd, recvData);
      break;
    }
  case CMD_TYPE.deviceInfo:
    {
      deviceInfoHelper(jsonCmd, recvData);
      break;
    }
  case CMD_TYPE.music:
    {
      musicHelper(jsonCmd, recvData);
      break;
    }
  case CMD_TYPE.picture:
    {
      pictureHelper(jsonCmd, recvData);
      break;
    }
  case CMD_TYPE.video:
    {
      videoHelper(jsonCmd, recvData);
      break;
    }
  default:
    {
      debug('HandleMessage.js undefined type :' + jsonCmd.type);
      jsonCmd.result = RS_ERROR.TYPE_UNDEFINED;
      if (socketWrappers[serverSocket])
        socketWrappers[serverSocket].send(jsonCmd, null);
      break;
    }
  }
}