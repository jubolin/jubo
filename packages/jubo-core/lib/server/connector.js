var Connector = function() {
  var self = this;
  
  self.connect = DDP.connect('http://localhost:4000');
}

_.extend(Connector.prototype, {
  subscribe: function(name, callback) {
    var self = this;

    self.connect.subscribe('jubo_thing_' + self.devid, function() {
      Jubo.Things.properties.find(
        {'tid': self.devid, 'property': name},
        {fields: {'value': 1}}
      ).observeChanges({
        changed: function(id, value) {
          callback(value);
        }
      });
    });
  },

  adjust: function(name,value) {
    var self = this;

    self.connect.call('adjust', 
      {'tid': self.devid, 'property': name, 'value': value});
  },

  status: function() {
    var self = this;
    return self.connect.status();
  },

  whoami: function(thingID, sn,callback) {
    var self = this;
    var dev = Jubo.Things.devices.findOne(
      {'thingID': thingID,'SN': sn},
      {fields: {tid: 1}}
    );

    if(dev) {
      self.devid = dev.tid;
      Jubo.Things.devices.update(
        {_id: dev._id}, 
        {$set: {'status': 'online'}}
      );

      callback();
    } else {
      var dev = Jubo.Things.devices.findOne(
        {'thingID': thingID, status: 'offline'}, 
        {fields: {tid: 1}});

      if(dev) {
        self.devid = dev.tid;
        Jubo.Things.devices.update(
          {'tid': dev.tid}, 
          {$set: {'SN': sn, 'status': 'online'}},
          function(error) {
            if(error) {
              console.log(error);
            }
          }
        );

        Jubolin.call('updateThingStatus', dev.tid, 'online', Meteor.settings.token);
        callback();
      } else {
        callback('not find device');
      }
    }
  }
});

Jubo.connect = function(id) {
  var ret = new Connector(id);
  return ret;
};


