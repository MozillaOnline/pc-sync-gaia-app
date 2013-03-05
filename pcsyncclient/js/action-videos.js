
var Action_videos = {
  sendfunc: null,
  videodb: null,
  bInited: false,
  requests: [],
  bRename: false,
  oldName : null,

  init: function (data) {
    if(this.bInited) return;
    this.sendfunc = data;
    this.initDB();
  },

  request: function (data) {
    var self = this;
    this.requests.push(data);
    if(!this.bInited) {
      var timer = setInterval(function() {
      if(self.bInited) {
        clearInterval(timer);
        self.exeRequest();
        }
      }, 100);
    }else {
     dump("=====exe requests directory");
     this.exeRequest(); 
    }
  },

  response: function (data) {
    switch (data.command) {
    default:
      dump('pcsync action-videos.js line65 :' + data);
      break;
    }
  },

  success: function (resultid,resultcommand,resultdata) {
    var videosData = {
      action: 'response',
      id: resultid,
      command: resultcommand,
      status: 200,
      data: resultdata
    };
    dump('pcsync action-videos.js line78 :' + JSON.stringify(videosData));
    Action_videos.sendresponse(videosData);
  },

  error: function (resultid,resultcommand,resultdata) {
    var videosData = {
      action: 'response',
      id: resultid,
      command: resultcommand,
      status: 201,
      data: resultdata
    };
    dump('pcsync action-videos.js line93 :' + JSON.stringify(videosData));
    Action_videos.sendresponse(videosData);
  },

  getAllVideosInfo: function(requestid,requestcommand) {
    this.videodb.getAll(function(records) {
    var videos = records;
    var result = [];

    for(var i=0; i<videos.length; i++) {
      var fileInfo = {
        name:null,
        type:null,
        size:0,
        date:0
      };
      fileInfo.name = videos[i].name;
      fileInfo.type = videos[i].type;
      fileInfo.size = videos[i].size;
      fileInfo.date = videos[i].date;
      result.push(fileInfo);
    }
    Action_videos.success(requestid,requestcommand, result);
    });
  },
/*
  getVideos: function(requestid,requestcommand,requestdata) {
    dump("=====getVideos");
  },

  addVideos: function(requestid,requestcommand,requestdata) {
    //dump('===name:' + requestdata[0].name);
    //dump('===content:' + requestdata[0].file);
  },
*/
  deleteVideos: function(requestid,requestcommand,requestdata) {
    var self = this;
    requestdata.forEach(function(name,index) {
      self.videodb.deleteFile(name); 
    });
    Action_videos.success(requestid,requestcommand,null);
  },

  renameVideo: function(requestid,requestcommand,requestdata) {
    var oldFile = requestdata[0];
    var newFile = requestdata[1];
    var self = this;
    this.videodb.getFile(oldFile,function(file) {
      self.videodb.addFile(newFile, file);
      self.oldName = oldFile;
      self.bRename = true;
      //self.videodb.deleteFile(oldFile);
    });
    Action_videos.success(requestid,requestcommand,null);
  },

  sendresponse: function (data) {
    if(this.sendfunc){
      this.sendfunc.send(JSON.stringify(data));
    }
  },

  initDB: function() {
    this.videodb = new MediaDB('videos', metadataParsers.videoMetadataParser
    /*
    , {
      directory: 'DCIM/',
      autoscan: false,
      batchHoldTime: 350,
      batchSize: 12 
     }*/);
    var self = this;
    this.videodb.onunavailable = function(event) {
      //get all the reasons from event
      dump("=====videodb is unavailable");
    };
    this.videodb.onready = function() {
      //self.videodb.scan();
      dump("=====videodb is ready");
    };
    this.videodb.onscanstart = function() {
      dump("=====videodb scan start");
    };
    this.videodb.onscanend = function() {
      self.bInited = true;
      dump("=====videodb scan end");
    };
    this.videodb.oncreated = function(event) {
      dump("=====video file create");
      if(self.bRename) {
        self.bRename = false;
        self.videodb.deleteFile(self.oldName);
      }
    };
    this.videodb.ondeleted = function(event) {
      dump("=====video deleted");
    };
  },

  exeRequest: function() {
    var num = this.requests.length;
    for(var i=0; i<num; i++) {
      var data = this.requests.shift();
      switch (data.command) {
        case "getAllVideosInfo": {
          this.getAllVideosInfo(data.id, data.command);
          break;
      }/*
        case "getVideos": {
          this.getVideos(data.id, data.command,data.data);
          break;
      }
        case "addVideos": {
          this.addVideos(data.id, data.command,data.data);
          break;
      }*/
        case "deleteVideos": {
          this.deleteVideos(data.id, data.command,data.data);
          break;
      }
        case "renameVideo": {
          this.renameVideo(data.id, data.command,data.data);
          break;
      }
        default:
          dump('pcsync action-videos.js line57 :' + data);
          break;
      }
    }
  }
};

