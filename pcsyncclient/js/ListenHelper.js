/*------------------------------------------------------------------------------------------------------------
 *File Name: ListenHelper.js
 *Created By: dxue@mozilla.com
 *Description:
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/
function listenHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    debug('listenHelper.js start');
    listenSocket = socket;
    listenJsonCmd = jsonCmd;
    listenSendCallback = sendCallback;
  } catch (e) {
    debug('listenHelper.js listen failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}