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
    case APP_COMMAND.getAllApps:
      {
        getAllApps(jsonCmd, sendCallback, sendList);
        break;
      }
    case APP_COMMAND.getInstalledApps:
      {
        getInstalledApps(jsonCmd, sendCallback, sendList);
        break;
      }
    case APP_COMMAND.uninstallAppByName:
      {
        uninstallAppByName(jsonCmd, sendCallback, sendList, recvList);
        break;
      }
    default:
      {
        console.log('AppManagerHelper.js undefined command :' + jsonCmd.command);
        jsonCmd.result = RS_ERROR.COMMAND_UNDEFINED;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
        break;
      }
    }
  } catch (e) {
    console.log('AppsManagerHelper.js appsManagerHelper failed: ' + e);
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
    jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
  }
}

function getAllApps(jsonCmd, sendCallback, sendList) {
  try {
    var appsInfo = [];
    var request = window.navigator.mozApps.mgmt.getAll();
    request.onerror = function(e) {
      console.log("Error calling getAll: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETALLAPPS;
      jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
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
      jsonCmd.smallDatalength = appsData.length;
      jsonCmd.largeDatalength = 0;
      if (appsData.length <= MAX_PACKAGE_SIZE) {
        sendCallback(jsonCmd, appsData);
      } else {
        sendCallback(jsonCmd, appsData.substr(0, MAX_PACKAGE_SIZE));
        for (var i = MAX_PACKAGE_SIZE; i < appsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < appsData.length) {
            sendList.push(appsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(appsData.substr(i));
          }
        }
      }
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
    console.log('AppsManagerHelper.js getAllApps failed: ' + e);
  }
}

function getInstalledApps(jsonCmd, sendCallback, sendList) {
  try {
    var appsInfo = [];
    var request = window.navigator.mozApps.getInstalled();
    request.onerror = function(e) {
      console.log("Error calling getInstalled: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
      jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
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
      jsonCmd.smallDatalength = appsData.length;
        jsonCmd.largeDatalength = 0;
      if (appsData.length <= MAX_PACKAGE_SIZE) {
        sendCallback(jsonCmd, appsData);
      } else {
        sendCallback(jsonCmd, appsData.substr(0, MAX_PACKAGE_SIZE));
        for (var i = MAX_PACKAGE_SIZE; i < appsData.length; i += MAX_PACKAGE_SIZE) {
          if (i + MAX_PACKAGE_SIZE < appsData.length) {
            sendList.push(appsData.substr(i, MAX_PACKAGE_SIZE));
          } else {
            sendList.push(appsData.substr(i));
          }
        }
      }
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
    console.log('AppsManagerHelper.js getInstalledApps failed: ' + e);
  }
}

function uninstallAppByName(jsonCmd, sendCallback, sendList, recvList) {
  try {
    var request = window.navigator.mozApps.mgmt.getAll();
    request.onerror = function(e) {
      console.log("Error calling getAll: " + request.error.name);
      jsonCmd.result = RS_ERROR.APPSMANAGER_GETINSTALLEDAPPS;
      jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
      sendCallback(jsonCmd, null);
    };
    request.onsuccess = function(e) {
      console.log("Success, number of apps: " + request.result.length);
      for (var i = 0; i < request.result.length; i++) {
        //console.log("Success, name of app: " + request.result[i].manifest.name);
        if (request.result[i].manifest.name == recvList[0]) {
          var uninstallRequest;
          if (request.result[i].isBookmark) {
            uninstallRequest = request.result[i].uninstall();
          } else {
            uninstallRequest = window.navigator.mozApps.mgmt.uninstall(request.result[i]);
          }
          uninstallRequest.onerror = function(e) {
            console.log("Error calling uninstall: " + request.error.name);
            jsonCmd.result = RS_ERROR.APPSMANAGER_UNSTALLAPP;
            jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
            sendCallback(jsonCmd, null);
          };
          uninstallRequest.onsuccess = function(e) {
            console.log("onsuccess calling uninstall");
            jsonCmd.result = RS_OK;
            jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
            sendCallback(jsonCmd, null);
          };
          break;
        }
      }
      if (i >= request.result.length) {
        jsonCmd.result = RS_ERROR.APPSMANAGER_NOTFOUNDAPP;
        jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
        sendCallback(jsonCmd, null);
      }
    };
  } catch (e) {
    jsonCmd.result = RS_ERROR.UNKNOWEN;
    jsonCmd.smallDatalength = 0;
        jsonCmd.largeDatalength = 0;
    sendCallback(jsonCmd, null);
    console.log('AppsManagerHelper.js uninstallAppByName failed: ' + e);
  }
}