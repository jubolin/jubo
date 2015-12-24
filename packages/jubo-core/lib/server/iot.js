/**
 * @namespace Jubo
 * @summary The namespace for all Jubo.related methods and classes.
 */

Jubolin = DDP.connect('http://localhost:3000');

var Things = new Mongo.Collection(
  'jubolin_iot_things', 
  {connection: Jubolin});

var Properties = new Mongo.Collection(
  'jubolin_things_properties', 
  {connection: Jubolin});

var publishProperties = function (devid) {
  console.log('publish properties jubo_thing_'+devid);
  Meteor.publish('jubo_thing_' + devid, function(tid) {
    var self = this;

    console.log('find '+tid+' properties and publish');
    var handler = Jubo.Things.properties.find(
      {'tid':tid},
      {fields: {'label': 0}}
    ).observe({
      added: function(doc) {
        self.added('Jubo_things_properties',doc._id,doc);
      },

      changed: function(doc) {
        self.changed('Jubo_things_properties',doc._id,doc);
      }
    });

    self.ready();
  });
}

Jubolin.call('whoami',{
  'uuid': Meteor.settings.uuid,
  'token': Meteor.settings.token
});

Jubolin.subscribe('group', {'gateway': Meteor.settings.uuid}, function() {
  var handle = Things.find({'gateway': Meteor.settings.uuid}).observe({
    added: function(device) {
      if(Jubo.Things.devices.find({'tid': device.tid}).count() === 0) {
        Jubolin.call('updateThingStatus', device.tid, 'updating');
        // Download device's connector
        // Config device 
        Jubolin.call('updateThingStatus', device.tid, 'loading', Meteor.settings.token);
        device.status = 'offline';
        Jubo.Things.devices.insert(device);
        //addDevice(device);
        Jubolin.call('updateThingStatus', device.tid, 'offline', Meteor.settings.token);
      } else {
        //publishProperties(device.tid);
      }

    },

    removed: function(device) {
      console.log("jubolin remove device:",device);
      Jubo.Things.devices.remove({'tid': device.tid});
      Jubo.Things.properties.remove({'tid': device.tid});
    }
  });
});

Jubolin.subscribe('group_properties', {'gateway': Meteor.settings.uuid}, function() {
  Properties.find({'gateway': Meteor.settings.uuid}).observeChanges({
    added: function(id, property) {
      if(Jubo.Things.properties.find({_id: id}).count() === 0) {
        console.log('add proeprty ', id, property);
        property._id = id;
        Jubo.Things.properties.insert(property);
      }
    },

    changed: function(id, fields) {
      var property = {
        _id : id,
        'value': fields.value
      };

      console.log('changed property ', id, fields);
      Jubo.Things.properties.update(
        {'_id':id},
        {$set:{'value': property.value}});
    },

    removed: function(id) {
      Jubo.Things.properties.remove({'_id': id});
    }
  });
});


Jubo.Logger = Winston; 

Meteor.publish("Jubo_things_devices",function(){
  return Jubo.Things.devices.find();
});

Meteor.publish("Jubo_things_properties",function(){
  return Jubo.Things.properties.find();
});

/*Jubo.Things.install = function(tid,location) {
  Jubo.Things.devices.update({tid:tid},{$set:{'location': location}});
  Jubo.Things.properties.update({tid:tid},{$set:{'location': location}},{multi:true});
};

Jubo.Things.authorize = function(app,locations) {
  _.each(locations,function(location) {
    Jubo.Logger.log('info',app, ' authorized to ', location);
    Jubo.Things.properties.update({'location':location},{$addToSet: {'authorized': app}},{multi:true});
    // ToDo 细粒度的权限控制
    Jubo.Things.properties.allow({
      update: function(userId,doc) {
        return true;
      }
    });
  });
};
*/

var addDevice = function(device) {
  var dev = {
    tid: device.tid,
    controller: device.controller,
    logoURL: device.logoURL,
    status : device.status,
    statusColor: '#cccccc',
    thingID: device.thingID
  };


  Jubo.Things.devices.insert(dev,function(err,result) {
    if(err) { 
      return cb(err);
    }

    _.each(device.properties,function(property) {
      property.tid = thing.tid;
      property.timestamp = new Date().getTime();
      property.role = 'newcomer';

      Jubo.Things.properties.insert(property,function(err,result) {
        if(err) { 
          return cb(err);
        } else { 
          Jubo.Logger.log('info','add property ', property);
        }
      });
    });
  });
}

var adjustProperty = function(property) {
  var me;
  var now = new Date().getTime();
    
  me = Jubo.Things.properties.findOne({
    'tid': property.tid,
    'name': property.name
  });


  if(me.value === property.value)
    return;

  //checkDevice(property);
    
  Jubo.Things.properties.update(
    {'_id':me._id},
    {$set:{'value': property.value,'timestamp': now, 'role': 'veteran'}}
  );

  me.value = property.value;
  //evolve(me); 
}

Meteor.methods({
  adjust: function(property) {
    adjustProperty(property);
    Jubolin.call('adjustProperty',property);
  },

  feedback: function(err,property) {
    if(err && property) {
      Jubo.Things.properties.update({'tid': property.tid},{$set:{'value': value}});
    }
  },

  remove: function(tid) {
    Jubo.Things.devices.remove({'tid':tid});
    Jubo.Things.properties.remove({'tid':tid});
  },

  createHomeSlice: function(name) {
    Jubo.Logger.log('info','create slice',name);
    Meteor.publish('Jubo_things_slice_' + name,function(name) {
      var self = this;
      var handler = Jubo.Things.properties.find({'authorized':name},{fields: {'authorized':0}}).observe({
        added: function(doc) {
          self.added('Jubo_things_properties',doc._id,doc);
        },
        changed: function(doc) {
          self.changed('Jubo_things_properties',doc._id,doc);
        }
      });

      self.ready();
    });
  },

  requestAuthorization: function(app,locations) {
    Jubo.Logger.log('info','Application',app,'request authorization',locations);
  }
});

