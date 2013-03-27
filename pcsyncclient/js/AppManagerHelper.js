/*------------------------------------------------------------------------------------------------------------
 *File Name: AppManagerHelper.js
 *Created By: dxue@mozilla.com
 *Description: Manage apps
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function appManagerHelper(jsonCmd, sendCallback, sendList, recvList) {
  try {
    switch (jsonCmd.command) {
    case "getAllApps":
      {
        getAllApps(jsonCmd, sendCallback, sendList);
        break;
      }
    case "getInstalledApps":
      {
        getInstalledApps(jsonCmd, sendCallback, sendList);
        break;
      }
    case "uninstallAppByName":
      {
        uninstallAppByName(jsonCmd, sendCallback, sendList);
        break;
      }
    default:
      {
        debug('AppManagerHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
        break;
      }
    }
  } catch (e) {
    debug('AppsManagerHelper.js appsManagerHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
  }
}

function getAllApps(jsonCmd, sendCallback, sendList) {
  try {
    var appsInfo = [];
    var request = window.navigator.mozApps.mgmt.getAll();
    request.onerror = function(e) {
      debug("Error calling getAll: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETALLAPPS;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = request.error.name;
      sendCallback(jsonCmd);
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
      if (appsData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = appsData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = appsData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = appsData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < appsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < appsData.length) {
            sendList.push(appsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(appsData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
    debug('AppsManagerHelper.js getAllApps failed: ' + e);
  }
}

function getInstalledApps(jsonCmd, sendCallback, sendList) {
  try {
    var appsInfo = [];
    var request = window.navigator.mozApps.getInstalled();
    request.onerror = function(e) {
      debug("Error calling getInstalled: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = request.error.name;
      sendCallback(jsonCmd);
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
      if (appsData.length <= MAX_PACKAGE_SIZE) {
        jsonCmd.data = appsData;
        jsonCmd.exdatalength = 0;
        sendCallback(jsonCmd);
      } else {
        jsonCmd.data = appsData.substr(0, MAX_PACKAGE_SIZE);
        jsonCmd.exdatalength = appsData.length - MAX_PACKAGE_SIZE;
        for (var i = MAX_PACKAGE_SIZE; i < appsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < appsData.length) {
            sendList.push(appsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(appsData.substr(i));
          }
        }
        sendCallback(jsonCmd);
      }
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
    debug('AppsManagerHelper.js getInstalledApps failed: ' + e);
  }
}

function uninstallAppByName(jsonCmd, sendCallback, sendList) {
  try {
    var request = window.navigator.mozApps.mgmt.getAll();
    request.onerror = function(e) {
      debug("Error calling getAll: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
      jsonCmd.exdatalength = 0;
      jsonCmd.data = request.error.name;
      sendCallback(jsonCmd);
    };
    request.onsuccess = function(e) {
      debug("Success, number of apps: " + request.result.length);
      var i = 0;
      for (i = 0; i < request.result.length; i++) {
        //debug("Success, name of app: " + request.result[i].manifest.name);
        if (request.result[i].manifest.name == jsonCmd.data) {
          var uninstallRequest;
          if (request.result[i].isBookmark) {
            uninstallRequest = request.result[i].uninstall();
          } else {
            uninstallRequest = window.navigator.mozApps.mgmt.uninstall(request.result[i]);
          }
          uninstallRequest.onerror = function(e) {
            debug("Error calling uninstall: " + request.error.name);
            jsonCmd.result = RS_ERROR.APPSMANAGER_UNSTALLAPP;
            jsonCmd.exdatalength = 0;
            jsonCmd.data = request.error.name;
            sendCallback(jsonCmd);
          };
          uninstallRequest.onsuccess = function(e) {
            debug("onsuccess calling uninstall");
            jsonCmd.result = RS_OK;
            jsonCmd.exdatalength = 0;
            jsonCmd.data = '';
            sendCallback(jsonCmd);
          };
          break;
        }
      }
      if (i >= request.result.length) {
        jsonCmd.result = RS_ERROR.APPSMANAGER_NOTFOUNDAPP;
        jsonCmd.exdatalength = 0;
        jsonCmd.data = '';
        sendCallback(jsonCmd);
      }
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.exdatalength = 0;
    jsonCmd.data = '';
    sendCallback(jsonCmd);
    debug('AppsManagerHelper.js uninstallAppByName failed: ' + e);
  }
}