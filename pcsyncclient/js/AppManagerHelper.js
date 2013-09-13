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
        getAllApps(socket,jsonCmd, sendCallback);
        break;
      }
    case APP_COMMAND.getInstalledApps:
      {
        getInstalledApps(socket,jsonCmd, sendCallback);
        break;
      }
    case APP_COMMAND.uninstallAppByName:
      {
        uninstallAppByName(socket,jsonCmd, sendCallback, recvData);
        break;
      }
    default:
      {
        console.log('AppManagerHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        sendCallback(socket, jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('AppsManagerHelper.js appsManagerHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket,jsonCmd, null);
  }
}

function getAllApps(socket, jsonCmd, sendCallback) {
  try {
    var appsInfo = [];
    var request = window.navigator.mozApps.mgmt.getAll();
    request.onerror = function(e) {
      console.log("Error calling getAll: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETALLAPPS;
      sendCallback(socket, jsonCmd, null);
    };
    request.onsuccess = function(e) {
      console.log("Success, number of apps: " + request.result.length);
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
      sendCallback(socket,jsonCmd, appsData);
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket,jsonCmd, null);
    console.log('AppsManagerHelper.js getAllApps failed: ' + e);
  }
}

function getInstalledApps(socket,jsonCmd, sendCallback) {
  try {
    var appsInfo = [];
    var request = window.navigator.mozApps.getInstalled();
    request.onerror = function(e) {
      console.log("Error calling getInstalled: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
      sendCallback(socket,jsonCmd, null);
    };
    request.onsuccess = function(e) {
      console.log("Success, number of apps: " + request.result.length);
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
      sendCallback(socket,jsonCmd, appsData);
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket,jsonCmd, null);
    console.log('AppsManagerHelper.js getInstalledApps failed: ' + e);
  }
}

function uninstallAppByName(socket,jsonCmd, sendCallback, recvData) {
  try {
    var appName = recvData;
    var request = window.navigator.mozApps.mgmt.getAll();
    request.onerror = function(e) {
      console.log("Error calling getAll: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
      sendCallback(socket,jsonCmd, null);
    };
    request.onsuccess = function(e) {
      console.log("Success, number of apps: " + request.result.length);
      for (var i = 0; i < request.result.length; i++) {
        //console.log("Success, name of app: " + request.result[i].manifest.name);
        if (request.result[i].manifest.name == appName) {
          let uninstallRequest;
          if (request.result[i].isBookmark) {
            uninstallRequest = request.result[i].uninstall();
          } else {
            uninstallRequest = window.navigator.mozApps.mgmt.uninstall(request.result[i]);
          }
          uninstallRequest.onerror = function(e) {
            console.log("Error calling uninstall: " + request.error.name);
            jsonCmd.result = RS_ERROR.APPSMANAGER_UNSTALLAPP;
            sendCallback(socket,jsonCmd, null);
          };
          uninstallRequest.onsuccess = function(e) {
            console.log("onsuccess calling uninstall");
            jsonCmd.result = RS_OK;
            sendCallback(socket,jsonCmd, null);
          };
          break;
        }
      }
      if (i >= request.result.length) {
        jsonCmd.result = RS_ERROR.APPSMANAGER_NOTFOUNDAPP;
        sendCallback(socket,jsonCmd, null);
      }
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    sendCallback(socket,jsonCmd, null);
    console.log('AppsManagerHelper.js uninstallAppByName failed: ' + e);
  }
}