var Connector = function() {
  var self = this;
  
  //self.connect = DDP.connect('http://localhost:4000');
}

var register = function(thingID, sn) {
  var devid = undefined;
  var dev = Jubo.Things.devices.findOne(
    {'thingID': thingID,'SN': sn},
    {fields: {tid: 1}}
  );

  if(dev) {
    devid = dev.tid;
    Jubo.Things.devices.update(
      {_id: dev._id},
      {$set: {'status': 'online'}}
    );
  } else {
    var dev = Jubo.Things.devices.findOne(
      {'thingID': thingID, status: 'offline'}, 
      {fields: {tid: 1}});

    if(dev) {
      devid = dev.tid;
      Jubo.Things.devices.update(
        {'tid': dev.tid}, 
        {$set: {'SN': sn, 'status': 'online'}}
      );

      Jubolin.call('updateThingStatus', dev.tid, 'online', Meteor.settings.token);
    }
  }

  return devid;
}

_.extend(Connector.prototype, {
  subscribe: function(name, callback) {
    var self = this;

    console.log('subscribe',self.devid,name);
    Jubo.Things.properties.find(
      {'tid': self.devid, 'name': name},
      {fields: {'value': 1,'parameters': 1, 'timestamp': 1}}
    ).observeChanges({
      changed: function(id, fields) {
        console.log('property',id,':',fields,'changed');
        callback(fields);
      }
    });
  },

  adjust: function(name,value) {
    var self = this;

    Jubo.Things.properties.update(
      {'tid': self.devid, 'name': name},
      {$set:{'value': value,'timestamp': new Date().getTime()}}
    );

    Jubolin.call('adjustProperty',{'tid': self.devid, 'name': name, 'value': value});
  },

  status: function() {
    var self = this;
    return self.connect.status();
  },

  whoami: function(thingID, sn, cb) {
    var retry = 0;
    var self = this;
    var handle = Meteor.setInterval(function() {
      self.devid = register(thingID,sn);
      if(self.devid || retry > 10) {
        Meteor.clearInterval(handle);
        if(retry > 10) {
          var error = 'Device ' + thingID + '[' + sn + ']' + 'register failed'; 
          console.log(error);
          cb && cb(error);
        } else {
          console.log('Device',thingID,sn,'register successed');
          cb && cb(undefined,self.devid);
        }
      }
      
      retry++;
    },500);
  }
});

Jubo.connect = function(id) {
  var ret = new Connector(id);
  return ret;
};


