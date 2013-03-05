
var Action_pictures = {
  sendfunc: null,
  photodb: null,
  bInited: false,
  requests: [],
  bRename: false,
  oldName: null,

  init: function (data) {
    if(this.bInited) return;
    this.sendfunc = data;
    this.initDB();
  },

  request: function (data) {
    dump("=====request");
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
      dump('pcsync action-pictures.js line65 :' + data);
      break;
    }
  },

  success: function (resultid,resultcommand,resultdata) {
    var picturesData = {
      action: 'response',
      id: resultid,
      command: resultcommand,
      status: 200,
      data: resultdata
    };
    dump('pcsync action-pictures.js line78 :' + JSON.stringify(picturesData));
    Action_pictures.sendresponse(picturesData);
  },

  error: function (resultid,resultcommand,resultdata) {
    var picturesData = {
      action: 'response',
      id: resultid,
      command: resultcommand,
      status: 201,
      data: resultdata
    };
    dump('pcsync action-pictures.js line93 :' + JSON.stringify(picturesData));
    Action_pictures.sendresponse(picturesData);
  },

  getAllPicsInfo: function(requestid,requestcommand) {
    this.photodb.getAll(function(records) {
    var photos = records;
    var result = [];
  
    for(var i=0; i<photos.length; i++) {
      var fileInfo = {
        name:null,
        type:null,
        size:0,
        date:0
      };
      fileInfo.name = photos[i].name;
      fileInfo.type = photos[i].type;
      fileInfo.size = photos[i].size;
      fileInfo.date = photos[i].date;
      result.push(fileInfo);
    }
    Action_pictures.success(requestid,requestcommand, result);
    });
  },

  getPics: function(requestid,requestcommand,requestdata) {
    dump("=====getPics");
    var self = this;
    self.photodb.getFile(requestdata[0],function getPic(file) {
      var size = 672;
      var blockNum = parseInt(file.size/size);
      if(file.size%size)
        blockNum++;
      var blocks = [];
      for(var i=0; i <blockNum-1; i++) {
        blocks.push(file.slice(i*size, (i+1)*size, file.type));
      }
      blocks.push(file.slice((blockNum-1)*size, file.size));
      var LOG = '';
      var count = 0;
      /*
      var fr = new FileReader();
      fr.readAsDataURL(blocks[count]);
      fr.onload = function fileLoad(e) {
        console.log('===' + count + e.target.result);
        //count++;
        //if(count < blockNum) {
        //  fr.readAsDataURL(blocks[count]);
        //}
      };
      fr.onloadend = function(e) {
        count++;
        if(count < blockNum) {
          fr.readAsDataURL(blocks[count]);
        }
      };
      */
      
      for(var i=0; i<blockNum; i++) {
        var fr = new FileReader();
        fr.onload = function(e) {
          count++;
          var pos = e.target.result.indexOf('base64');
          LOG = e.target.result.substr(pos+7, e.target.result.length-pos-7);
          //if(count == blockNum) {
            console.log("===" + count + ":" + LOG);
          //}
        };
        fr.readAsDataURL(blocks[i]);
      }
    });
    
    /*
    var asyncPics = [];
    var pics = [];
    var self = this;
    requestdata.forEach(function(value,index) {
      dump("=====picName:" + value);
      asyncPics.push(function (oncomplete) {
        self.photodb.getFile(value,function getPic(file) {
          var fr = new FileReader();
          fr.readAsDataURL(file);
          fr.onload = function loadPic(e) {
            pics.push(e.target.result);
            dump("=====" + e.target.result + "=====");
            oncomplete();
          };
        });
      });
    });
    syncExecuteAsyncFuncs(asyncPics, function() {
      var picsdata = {
        action: 'response',
        id: requestid,
        command: requestcommand,
        status: 200,
        data: pics
      };
      dump("=====Action send response");
      Action_pictures.sendresponse(picsdata);
    });
    */
  },

  addPics: function(requestid,requestcommand,requestdata) {
    //dump('===name:' + requestdata[0].name);
    //dump('===content:' + requestdata[0].file);
    dump('===' + requestdata[0].length);
  },

  deletePics: function(requestid,requestcommand,requestdata) {
    var self = this;
    requestdata.forEach(function(name,index) {
      self.photodb.deleteFile(name); 
    });
    Action_pictures.success(requestid,requestcommand,null);
  },

  renamePic: function(requestid,requestcommand,requestdata) {
    var oldFile = requestdata[0];
    var newFile = requestdata[1];
    var self = this;
    this.photodb.getFile(oldFile,function(file) {
      self.photodb.addFile(newFile, file);
      self.oldName = oldFile;
      self.bRename = true;
      //self.photodb.deleteFile(oldFile);
    });
    Action_pictures.success(requestid,requestcommand,null);
  },

  sendresponse: function (data) {
    if(this.sendfunc){
      dump("=====sending:" + JSON.stringify(data));
      this.sendfunc.send(JSON.stringify(data));
    }
  },

  initDB: function() {
    this.photodb = new MediaDB('pictures', metadataParsers.imageMetadataParser, {
      mimeTypes: ['image/jpeg','image/png'],
      version: 2,
      autoscan: false,
      batchHoldTime: 350,
      batchSize: 12
    });
    var self = this;
    this.photodb.onunavailable = function(event) {
      //get all the reasons from event
      dump("=====photodb is unavailable");
    };
    this.photodb.onready = function() {
      self.photodb.scan();
      dump("=====photodb is ready");
    };
    this.photodb.onscanstart = function() {
      dump("=====photodb scan start");
    };
    this.photodb.onscanend = function() {
      self.bInited = true;
      dump("=====photodb scan end");
    };
    this.photodb.oncreated = function(event) {
      dump("=====pic file create");
      if(self.bRename) {
        self.bRename = false;
        self.videodb.deleteFile(self.oldName);
      }
    };
    this.photodb.ondeleted = function(event) {
      dump("=====pic deleted");
    };
  },

  exeRequest: function() {
    dump("=====exeRequest");
    var num = this.requests.length;
    for(var i=0; i<num; i++) {
      var data = this.requests.shift();
      switch (data.command) {
        case "getAllPicsInfo": {
          this.getAllPicsInfo(data.id, data.command);
          break;
      }
        case "getPics": {
          this.getPics(data.id, data.command,data.data);
          break;
      }
        case "addPics": {
          this.addPics(data.id, data.command,data.data);
          break;
      }
        case "deletePics": {
          this.deletePics(data.id, data.command,data.data);
          break;
      }
        case "renamePic": {
          this.renamePic(data.id, data.command,data.data);
          break;
      }
        default:
          dump('pcsync action-pictures.js line57 :' + data);
          break;
      }
    }
  }
};

