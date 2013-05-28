/*------------------------------------------------------------------------------------------------------------
 *File Name: Background.js
 *Created By: dxue@mozilla.com
 *Description: Create TCP socket server
 *Modified By:
 *Description:
 *----------------------------------------------------------------------------------------------------------*/

function testSteps() {
  const name = window.location.pathname;
  console.log('MusicHelper.js dbRequest.name: ' + name);
  var request = indexedDB.open(name, 1);
  request.onsuccess = function(event) {
    console.log('MusicHelper.js dbRequest.onsuccess');
    var fileDB = event.target.result;
    request2 = fileDB.mozCreateFileHandle("temp.bin", "binary/random");
    console.log('MusicHelper.js mozCreateFileHandle.onsuccess');
  }
}
var musicDB = null;

function testMediaDB() {
  musicDB = new MediaDB('music', parseAudioMetadata, {
    indexes: ['metadata.album', 'metadata.artist', 'metadata.title', 'metadata.rated', 'metadata.played', 'date'],
    batchSize: 1,
    autoscan: false,
    version: 2
  });
  musicDB.onunavailable = function(event) {
    //get all the reasons from event
    console.log('MusicHelper.js musicDB is unavailable');
  };
  musicDB.onready = function() {
    musicDB.scan();
    console.log('MusicHelper.js musicDB is ready');
  };
  musicDB.onscanstart = function() {
    console.log('MusicHelper.js musicDB scan start');
  };
  musicDB.onscanend = function() {
    musicDB.getAll(function(records) {
      var musics = records;
      var result = [];
      for (var i = 0; i < musics.length; i++) {
        var fileInfo = {
          'name': musics[i].name,
          'type': musics[i].type,
          'size': musics[i].size,
          'date': musics[i].date
        };
        result.push(fileInfo);
      }
      var musicsData = JSON.stringify(result);
      console.log('MusicHelper.js musicsData ' + musicsData);
    });
  };
  musicDB.oncreated = function() {
    console.log('MusicHelper.js oncreated !!!!!!!!!!!!!!!!!!!!!!');
  };

}
var musicdb = null;

function testMediaDB2() {
  musicdb = new MediaDB('music', metadataParserWrapper, {
    indexes: ['metadata.album', 'metadata.artist', 'metadata.title', 'metadata.rated', 'metadata.played', 'metadata.picture', 'date'],
    batchSize: 1,
    autoscan: false,
    directory: '/home/dxue/Music',
    // We call scan() explicitly after listing music we know
    version: 2
  });

  function metadataParserWrapper(file, onsuccess, onerror) {
    LazyLoader.load('js/music_metadata_parser.js', function() {
      parseAudioMetadata(file, onsuccess, onerror);
    });
  }

  // This is called when DeviceStorage becomes unavailable because the
  // sd card is removed or because it is mounted for USB mass storage
  // This may be called before onready if it is unavailable to begin with
  musicdb.onunavailable = function(event) {
    var why = event.detail;
    //if (why === MediaDB.NOCARD) showOverlay('nocard');
    //else if (why === MediaDB.UNMOUNTED) showOverlay('pluggedin');
    // stop and reset the player then back to tiles mode to avoid crash
  };

  musicdb.onready = function() {
    // Concurrently, start scanning for new music
    musicdb.scan();
    console.warn('xds22222222222222222222222');
  };

  var filesDeletedWhileScanning = 0;
  var filesFoundWhileScanning = 0;
  var filesFoundBatch = 0;
  var scanning = false;
  var SCAN_UPDATE_BATCH_SIZE = 25; // Redisplay after this many new files

  // When musicdb scans, let the user know
  musicdb.onscanstart = function() {
    scanning = true;
    filesFoundWhileScanning = 0;
    filesFoundBatch = 0;
    filesDeletedWhileScanning = 0;
  };

  // And hide the throbber when scanning is done
  musicdb.onscanend = function() {
    scanning = false;
    if (filesFoundBatch > 0 || filesDeletedWhileScanning > 0) {
      filesFoundWhileScanning = 0;
      filesFoundBatch = 0;
      filesDeletedWhileScanning = 0;
    }
    musicdb.getAll(function(records) {
      var musicsData = JSON.stringify(records);
      console.log('MusicHelper.js musicsData ' + musicsData);
    });
  };

  musicdb.oncreated = function(event) {
    var n = event.detail.length;
    filesFoundWhileScanning += n;
    filesFoundBatch += n;
    var metadata = event.detail[0].metadata;
    if (filesFoundBatch > SCAN_UPDATE_BATCH_SIZE) {
      filesFoundBatch = 0;
    }
  };

  musicdb.ondeleted = function(event) {
    filesDeletedWhileScanning += event.detail.length;
  };

}


function testdeviceStorage() {
  var mediaTypes = ['pictures', 'videos', 'music', 'sdcard'];
  var remainingMediaTypes = mediaTypes.length;
  var media = [];
  mediaTypes.forEach(function(aType) {
    console.log('getting', aType);
    var storage = navigator.getDeviceStorage(aType);
    var req = storage.enumerate();
    req.onsuccess = function() {
      var file = req.result;
      if (file) {
        console.log(file.name);
        if (aType === 'music' && file.name.slice(0, 5) === 'DCIM/' && file.name.slice(-4) === '.3gp') {
          req.
          continue ();
        } else {
          media.push(file.name);
          req.
          continue ();
        }
      } else {
        remainingMediaTypes--;
      }
    };
    req.onerror = function() {
      console.error('failed to enumerate ' + aType, req.error.name);
      // callback(false);
    };
  });
}

testMediaDB2();
//  testdeviceStorage();