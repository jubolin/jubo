//TBee = {};
var SerialPort = Npm.require('serialport').SerialPort;
var util = Npm.require('util');
var EventEmitter = Npm.require('events').EventEmitter;

TBee = function() {
  return this;
}

TBee.DevicePoint = function(options) {
  var self = this;

  self.serialport = new SerialPort(options.serialport,options.baudrate);
  return self;
}

util.inherits(TBee.DevicePoint,EventEmitter);

TBee.ServerPoint = function(options) {
  var self = this;
  self.properties = DDP.connect(options.url); 
  return self;
}

util.inherits(TBee.ServerPoint,EventEmitter);

TBee.prototype.init = function(config) {
  var self = this;

  //self.serialport = config.serialport;
  //self.baudrate = config.baudrate;

  self.devicePoint = new TBee.DevicePoint(config);
  self.devicePoint.on('add',TBee.addThing);
  self.devicePoint.on('del',TBee.delThing);
  self.devicePoint.on('update',TBee.updateProperty);

  self.serverPoint = new TBee.ServerPoint(config);
  self.serverPoint.on('adjust',TBee.adjustProperty);

  self.devicePoint.serialport.open(function(error) {
    if(error)
      console.log("failed to open:" + error);
    else {
      self.devicePoint.serialport.on('data', function(data) {
        var msg = JSON.parse(data);
        self.devicePoint.emit(msg.type,msg.value);      
      });
    }
  });

  //TBee.serverPoint = new Mongo.Collection('jubo_things_properties');
 
}

TBee.prototype.run = function() {
  var self = this;


  /*self.devicePoint.serialport = new SerialPort(self.serialport, {
    baudrate: self.baudrate
  });

  TBee.DevicePoint.serialport.open(function(error) {
    if(error)
      console.log("failed to open:" + error);
    else {
      TBee.DevicePoint.serialport.on('data', function(data) {
        var msg = JSON.parse(data);
        self.emit(msg.type,msg.value);      
      });
    }
  });

  TBee.serverPoint = new Mongo.Collection('jubo_things_properties');
  var properties = TBee.serverPoint.subscrib('jubo_things_' + retValue.tid);
  properties.observeChanges({
    changed: function(id,property) {
      self.emit(property.method,property.value);       
    }
  });
  */
}

TBee.addThing = function(thing) {
  var self = this;

  Meteor.call('add',[thing],function(error,retValue) {
    if(error) {
      console.log('add thing failed');
    } else {
      TBee.devicePoint.serialport.write(JSON.stringify(retValue));
      self.serverPoint.properties.subscrib('jubo_things_' + retValue.tid)
          .observeChanges({
            changed: function(id,property) {
              self.serverPoint.emit(property.method,property.value);       
            }
        });
    }
  }); 
}

TBee.delThing = function(thingID){
  var self = this;

  Meteor.call('del',[thingID],
    function(error,retValue) {
      if(error) {
        console.log('remove thing failed');
      } else {
        self.devicePoint.serialport.write(JSON.stringify(retValue));
      }
  });
}

TBee.updateProperty = function(property) {
  var self = this;

  Meteor.call('adjust',[property],
    function(error,retValue) {
      if(error) {
        console.log('remove thing failed');
      } else {
        self.devicePoint.serialport.write(JSON.stringify(retValue));
      }
  });
}

TBee.adjustProperty = function(property) {
  self.devicePoint.serialport.write(JSON.stringify(property));
}

/*TBee.prototype.run() = function() {
  var self = this;
  //var config = JSON.parse('config.json');
  var tbee = new TBee();
  

  self.srvpoint = new TBee.ServerPoint();
  self.srvpoint.init(config.serverPoint);
  self.srvpoint.on('adjust',TBee.ServerPoint.adjustProperty)

  self.devpoint = new TBee.DevicePoint();
  self.devpoint.init(config.devicePoint);
  self.devpoint.on('add',TBee.DevicePoint.addThing);
  self.devpoint.on('update',TBee.DevicePoin.updateProperty);
  self.devpoint.on('remove',TBee.DevicePoin.removeThing);

}
*/

/*TBee.DevicePoint.prototype.init = function(devicePoint) {
  var self = this;

  TBee.DevicePoint.serialport = new SerialPort(devicePoint.serialport {
    baudrate: devicePoint.baudrate
  });

  TBee.DevicePoint.serialport.open(function(error) {
    if(error)
      console.log("failed to open:" + error);
    else {
      TBee.serialport.on('data', function(data) {
        var msg = JSON.parse(data);
        self.emit(msg.type,msg.value);      
      });
    }
  });
}
*/

