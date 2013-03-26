'use strict';

var THUMBNAIL_WIDTH = 160;  // Just a guess at a size for now
var THUMBNAIL_HEIGHT = 160;
var FROMCAMERA = /^DCIM\/\d{3}MZLLA\/VID_\d{4}\.3gp$/;

function fileNameToVideoName(filename) {
  filename = filename.split('/').pop()
    .replace(/\.(webm|ogv|mp4)$/, '')
    .replace(/[_\.]/g, ' ');
  return filename.charAt(0).toUpperCase() + filename.slice(1);
}

function metaDataParser(videofile, callback, metadataError, delayed) {
  dump("===== file name:" + videofile.name);
  
  if (!delayed && FROMCAMERA.test(videofile.name)) {
    setTimeout(function() {
      metaDataParser(videofile, callback, metadataError, true);
    }, 2000);
    return;
  }
  
  var previewPlayer = document.createElement('video');
  var completed = false;

  if (!previewPlayer.canPlayType(videofile.type)) {
    return callback({isVideo: false});
  }

  var url = URL.createObjectURL(videofile);
  var metadata = {
    isVideo: true,
    title: fileNameToVideoName(videofile.name)
  };

  previewPlayer.preload = 'metadata';
  previewPlayer.style.width = THUMBNAIL_WIDTH + 'px';
  previewPlayer.style.height = THUMBNAIL_HEIGHT + 'px';
  previewPlayer.src = url;
  previewPlayer.onerror = function(e) {
    if (!completed) {
      metadataError(metadata.title);
    }
    previewPlayer.removeAttribute('src');
    previewPlayer.load();
  };
  previewPlayer.onloadedmetadata = function() {
    dump('===== width:' + previewPlayer.videoWidth);
    // File Object only does basic detection for content type,
    // if videoWidth is 0 then this is likely an audio file (ogg / mp4)
    if (!previewPlayer.videoWidth) {
      dump("===== in return");
      return callback({isVideo: false});
    }

    metadata.duration = previewPlayer.duration;
    metadata.width = previewPlayer.videoWidth;
    metadata.height = previewPlayer.videoHeight;

    function createThumbnail() {
      captureFrame(previewPlayer, metadata, function(poster) {
        metadata.poster = poster;
        URL.revokeObjectURL(url);
        completed = true;
        previewPlayer.removeAttribute('src');
        previewPlayer.load();
        callback(metadata);
      });
    }

    // If this is a .3gp video file, look for its rotation matrix and
    // then create the thumbnail. Otherwise set rotation to 0 and
    // create the thumbnail.
    // getVideoRotation is defined in shared/js/media/get_video_rotation.js
    if (/.3gp$/.test(videofile.name)) {
      getVideoRotation(videofile, function(rotation) {
        if (typeof rotation === 'number')
          metadata.rotation = rotation;
        else if (typeof rotation === 'string')
          console.warn('Video rotation:', rotation);
        createThumbnail();
      });
    } else {
      metadata.rotation = 0;
      createThumbnail();
    }
  };
}

function captureFrame(player, metadata, callback) {
  var skipped = false;
  var image = null;
  function doneSeeking() {
    player.onseeked = null;
    try {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      canvas.width = THUMBNAIL_WIDTH;
      canvas.height = THUMBNAIL_HEIGHT;
      // If a rotation is specified, rotate the canvas context
      if ('rotation' in metadata) {
        ctx.save();
        switch (metadata.rotation) {
        case 90:
          ctx.translate(THUMBNAIL_WIDTH, 0);
          ctx.rotate(Math.PI / 2);
          break;
        case 180:
          ctx.translate(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
          ctx.rotate(Math.PI);
          break;
        case 270:
          ctx.translate(0, THUMBNAIL_HEIGHT);
          ctx.rotate(-Math.PI / 2);
          break;
        }
      }
      ctx.drawImage(player, 0, 0, THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT);
      if (metadata.rotation) {
        ctx.restore();
      }
      image = canvas.mozGetAsFile('poster', 'image/jpeg');
    } catch (e) {
      console.error('Failed to create a poster image:', e);
    }
    if (skipped) {
      player.currentTime = 0;
    }
    callback(image);
  }

  // If we are on the first frame, lets skip into the video since some
  // videos just start with a black screen
  if (player.currentTime === 0) {
    player.currentTime = Math.floor(player.duration / 4);
    skipped = true;
  }

  if (player.seeking) {
    player.onseeked = doneSeeking;
  } else {
    doneSeeking();
  }
}
