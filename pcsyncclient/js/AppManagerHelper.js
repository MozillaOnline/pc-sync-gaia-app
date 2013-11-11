/*------------------------------------------------------------------------------------------------------------
 *File Name: AppManagerHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage apps
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function appManagerHelper(socket, jsonCmd, sendCallback, recvData) {
  try {
    switch (jsonCmd.command) {
    case APP_COMMAND.getAllApps:
      {
        getAllApps(socket, jsonCmd, sendCallback);
        break;
      }
    case APP_COMMAND.getInstalledApps:
      {
        getInstalledApps(socket, jsonCmd, sendCallback);
        break;
      }
    case APP_COMMAND.uninstallAppByName:
      {
        uninstallAppByName(socket, jsonCmd, sendCallback, recvData);
        break;
      }
    default:
      {
        debug('AppManagerHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    debug('AppsManagerHelper.js appsManagerHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket, jsonCmd, null);
  }
}

function getAllApps(socket, jsonCmd, sendCallback) {
  var appsInfo = [];
  var request = window.navigator.mozApps.mgmt.getAll();
  request.onerror = function(e) {
    debug("Error calling getAll: " + request.error.name);
    jsonCmd.result = RS_ERROR.APPSMANAGER_GETALLAPPS;
    sendCallback(socket, jsonCmd, null);
  };
  request.onsuccess = function(e) {
    debug("Success, number of apps: " + request.result.length);
    for (var i = 0; i < request.result.length; i++) {
      var appInfo = {
        'manifest': request.result[i].manifest,
        'manifestURL': request.result[i].manifestURL,
        'origin': request.result[i].origin,
        'installOrigin': request.result[i].installOrigin,
        'installTime': request.result[i].installTime,
        'receipts': request.result[i].receipts
      }
      appsInfo.push(appInfo);
    }
    jsonCmd.result = RS_OK;
    var appsData = JSON.stringify(appsInfo);
    sendCallback(socket, jsonCmd, appsData);
  };
}

function getInstalledApps(socket, jsonCmd, sendCallback) {
  var appsInfo = [];
  var request = window.navigator.mozApps.getInstalled();
  request.onerror = function(e) {
    debug("Error calling getInstalled: " + request.error.name);
    jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
    sendCallback(socket, jsonCmd, null);
  };
  request.onsuccess = function(e) {
    debug("Success, number of apps: " + request.result.length);
    for (var i = 0; i < request.result.length; i++) {
      var appInfo = {
        'manifest': request.result[i].manifest,
        'manifestURL': request.result[i].manifestURL,
        'origin': request.result[i].origin,
        'installOrigin': request.result[i].installOrigin,
        'installTime': request.result[i].installTime,
        'receipts': request.result[i].receipts
      }
      appsInfo.push(appInfo);
    }
    jsonCmd.result = RS_OK;
    var appsData = JSON.stringify(appsInfo);
    sendCallback(socket, jsonCmd, appsData);
  };
}

function uninstallAppByName(socket, jsonCmd, sendCallback, recvData) {
  var appName = recvData;
  var request = window.navigator.mozApps.mgmt.getAll();
  request.onerror = function(e) {
    debug("Error calling getAll: " + request.error.name);
    jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
    sendCallback(socket, jsonCmd, null);
  };
  request.onsuccess = function(e) {
    debug("Success, number of apps: " + request.result.length);
    for (var i = 0; i < request.result.length; i++) {
      if (request.result[i].manifest.name != appName) {
        continue;
      }
      let uninstallRequest;
      if (request.result[i].isBookmark) {
        uninstallRequest = request.result[i].uninstall();
      } else {
        uninstallRequest = window.navigator.mozApps.mgmt.uninstall(request.result[i]);
      }
      uninstallRequest.onerror = function(e) {
        debug("Error calling uninstall: " + request.error.name);
        jsonCmd.result = RS_ERROR.APPSMANAGER_UNSTALLAPP;
        sendCallback(socket, jsonCmd, null);
      };
      uninstallRequest.onsuccess = function(e) {
        debug("onsuccess calling uninstall");
        jsonCmd.result = RS_OK;
        sendCallback(socket, jsonCmd, null);
      };
      break;
    }
    if (i >= request.result.length) {
      jsonCmd.result = RS_OK;
      sendCallback(socket, jsonCmd, null);
    }
  };
}