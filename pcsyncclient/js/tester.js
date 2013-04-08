/*------------------------------------------------------------------------------------------------------------
 *File Name: Background.js
 *Created By: dxue@mozilla.com
 *Description: Create TCP socket server
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function testSteps() {
  const name = window.location.pathname;
  console.log('MusicHelper.js dbRequest.name: '+name);
  var request = indexedDB.open(name, 1);
  request.onsuccess = function(event) {
    console.log('MusicHelper.js dbRequest.onsuccess');
    var fileDB = event.target.result;
    request2 = fileDB.mozCreateFileHandle("temp.bin", "binary/random");
    console.log('MusicHelper.js mozCreateFileHandle.onsuccess');
  }
}

testSteps();