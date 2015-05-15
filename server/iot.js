/**
 * @namespace IoT
 * @summary The namespace for all IoT-related methods and classes.
 */

IoT = {};

IoT.Home = {};
IoT.Home.followers = {};
IoT.Home.relations = jurelations;

IoT.Device = {};
IoT.Device.devices = judevs;
IoT.Device.properties = juhome;

IoT.Logger = Winston; 

Meteor.startup(function() {
  var now = new Date().getTime(); 

  judevs.remove({});
  judevs.insert({ 
    'devid' : 'P28nMQedRNHmSiPAN', 
    'about': {
      'name': "客厅灯",
      'type' : 'bulb', 
      'location' : 'home.parlour', 
    },
    "connector" : "alljoyn", 
    "status" : "on", 
    "startTime": now, 
    "statusColor" : "#008000", 
    "icon" : "lighting-bulb.svg" ,
    'controller': 'default',
  });

  judevs.insert({ 
    'devid' : 'P28nMQedRNHmSiPAO', 
    'about': {
      'name': "卧室灯",
      'type' : 'bulb', 
      'location' : 'home.bedroom', 
    },
    "connector" : "ddp", 
    "status" : "off", 
    "startTime": 'doom', 
    "statusColor" : "#cccccc", 
    "icon" : "lighting-bulb.svg",
    'controller': 'default',
  });

  judevs.insert({ 
    'devid' : 'P28nMQedRNHmSiPAP', 
    'about': {
      'name': "电视",
      'type' : 'media', 
      'location' : 'home.parlour', 
    },
    "connector" : "alljoyn", 
    "status" : "on", 
    "startTime": now, 
    "statusColor" : "#008000", 
    "icon" : "media-video.svg", 
    'controller': 'default',
  });

  judevs.insert({ 
    'devid' : 'P28nMQedRNHmSiPAQ', 
    'about': {
      'name': "门铃",
      'type' : 'sensor', 
      'location' : 'home.parlour', 
    },
    "connector" : "alljoyn", 
    "status" : "on", 
    "startTime": now, 
    "statusColor" : "#008000", 
    "icon" : "sensor-door.svg",
    'controller': 'default',
  });

  judevs.insert({ 
    'devid' : 'P28nMQedRNHmSiPAC', 
    'about': {
      'name': "插座",
      'type' : 'switch', 
      'location' : 'home.parlour', 
    },
    "connector" : "ddp", 
    "status" : "off", 
    "startTime": 'doom', 
    "statusColor" : "#cccccc", 
    "icon" : "switch-onoff.svg", 
    'controller': 'default',
  });

  juhome.remove({});
  juhome.insert({ 
    "devid" : "P28nMQedRNHmSiPAN",
    'pid': 'A28nMQedRNHmSiPAN',
    "property" : "brightness",
    "service" : "lighting",
    "value" : "100",
    "label" : "亮度",
    'role': 'citizen',
  });

  juhome.insert({ 
    "devid" : "P28nMQedRNHmSiPAN",
    'pid': 'B28nMQedRNHmSiPAN',
    "property" : "color",
    "service" : "lighting",
    "value" : "#ffefdb",
    "label" : "颜色",
    'role': 'citizen',
  });
});

Meteor.publish("iot-devices",function(){
  return IoT.Device.devices.find();
});

Meteor.publish("iot-properties",function(){
  return IoT.Device.properties.find();
});

IoT.Device.get = function(devid) {
  return IoT.Device.devices.findOne({'devid':devid});
};

IoT.Home.installDevice = function(devid,location) {
  IoT.Device.devices.update({devid:devid},{$set:{'location': location}});
  IoT.Device.properties.update({devid:devid},{$set:{'location': location}},{multi:true});
};

IoT.Home.authorize = function(app,locations) {
  _.each(locations,function(location) {
    IoT.Logger.log('info',app, ' authorized to ', location);
    IoT.Device.properties.update({'location':location},{$addToSet: {'authorized': app}},{multi:true});
    // ToDo 细粒度的权限控制
    IoT.Device.properties.allow({
      update: function(userId,doc) {
        return true;
      }
    });
  });
};

IoT.uuid = function() {
  return Random.id();
}
var survived = function(rules) {
  return true;
};

var follow = function(friend,me) {
  var handler = IoT.Device.properties.find({'pid': friend.pid}).observeChanges({
    changed: function(id,property) {

      var relation = IoT.Home.relations.findOne({'me': me.pid, 'friend': friend.pid});
        if(property.value === relation.tie) { 
          // increase friendship
          IoT.Logger.log('info','increase friendship ', relation);
          IoT.Home.relations.update(
            {'_id':relation._id},
            {$inc: {'friendship': 1}}
          );
        }
      }
    });
      
    // gather survival rules
  _.each(me.rules, function(rule) {
    var property = IoT.Device.properties.find({'pid': rule.pid});
    rule.value = property.value;
    IoT.Logger.log('info','gather rule',rule);
  });

  IoT.Home.relations.insert({
    'me': me.pid, 
    'friend': friend.pid,
    'friendship': 0,
    'tie': friend.value
  },function(err,id) {
    IoT.Logger.log('info','create the follow relationship',
                   {'me': me.pid,'friend': friend.pid,'tie': friend.value});

    IoT.Home.followers[id] = handler;
  });

  IoT.Device.properties.update(
    {'_id': me._id},
    {$set: {'rules': me.rules}}
  );
};



Meteor.methods({
  add: function(device) {
    var devid = IoT.uuid();
    var dev = {
      location: 'Home',
      devid: devid,
      type: device.type,
      about: device.about,
      connector: device.connector,
    };

    IoT.Device.devices.insert(dev,function(err,result) {
      if(err) return cb(err);

      _.each(device.properties,function(property) {
        property.pid = IoT.uuid();
        property.devid = devid;
        property.timestamp = new Date().getTime();
        //property.friends = [];
        property.role = 'founder';

        IoT.Device.properties.insert(property,function(err,result) {
          if(err) return cb(err);
          IoT.Logger.log('info','add property', property);
        });
      });
    });

    Meteor.publish('jubo_iot_device_' + dev.devid, function(devid) {
      var self = this;
      var handler = IoT.Device.properties.find({'devid':devid},{fields: {'label': 0}}).observe({
        added: function(doc) {
          self.added('jubo_iot_properties',doc._id,doc);
        },

        changed: function(doc) {
          self.changed('jubo_iot_properties',doc._id,doc);
        }
      });

      self.ready();
    });

    return devid;
  },

  adjust: function(property) {
    var self = this;
    var timestamp = new Date().getTime();
    var friends = IoT.Device.properties.find({ 
      $and: [
        {'timestamp': {$gt: (timestamp - 60*1000)}},
        {'timestamp': {$lt: timestamp}},
        {'role': {$ne: 'founder'}}
      ]
    });

    var me = IoT.Device.properties.findOne({
      'devid': property.devid,
      'service': property.service,
      'property': property.property
    });

    
    IoT.Device.properties.update(
      {'_id':me._id},
      {$set:{'value': property.value,'timestamp': timestamp, 'role': 'citizen'}});

    friends.forEach(function(friend)  {
      relation = IoT.Home.relations.findOne({'me': me.pid,'friend': friend.pid});
      if(relation === undefined) {
        follow(friend,me);
      } else {
        if((relation.friendship - 1 ) <= 0) {
          // remove follower
          IoT.Logger.log('info','remove follower',relation);
          IoT.Home.followers[relation._id].stop();
          delete IoT.Home.followers[relation._id];
        } else {
          // decrease friendship
          IoT.Logger.log('info','decrease friendship',relation);
          IoT.Home.relations.update(
            {'_id': relation._id},
            {$inc: {'friendship': -1}}
          );
        }
      }
    });
  },

  feedback: function(err,property) {
    if(err && property) {
      IoT.Device.properties.update({'devid': property.devid},{$set:{'value': value}});
    }
  },

  remove: function(devid) {
    IoT.Device.devices.remove({'devid':devid});
    IoT.Device.properties.remove({'devid':devid});
  },

  createHomeSlice: function(name) {
    console.log('crate home slice',name);
    Meteor.publish('jubo_iot_home_slice_' + name,function(name) {
      var self = this;
      var handler = IoT.Device.properties.find({'authorized':name},{fields: {'authorized':0}}).observe({
        added: function(doc) {
          self.added('jubo_iot_properties',doc._id,doc);
          //console.log('publish added:',doc);
        },
        changed: function(doc) {
          self.changed('jubo_iot_properties',doc._id,doc);
          //console.log('publish changed:',doc);
        }
      });

      self.ready();
    });
  },

  requestAuthorization: function(app,locations) {
    console.log('Application ' + app + 'request authorization ' + locations);
  }
});

