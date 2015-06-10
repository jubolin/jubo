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

      var query = {'me': me.pid,'friend': friend.pid,'tie':{'me': me.value,'friend': friend.value}};
      var relation = IoT.Home.relations.findOne(query);

      IoT.Logger.log('info','property',property,'changed.');
      IoT.Logger.log('info','found the relationship',query);

      if(property.value === relation.tie.friend) { 
        IoT.Logger.log('info','increase friendship', relation);
        IoT.Home.relations.update(
          {'_id': relation._id},
          {$inc: {'friendship': 1}}
        );

        // update me
        IoT.Device.properties.update(
          {'_id': me._id},
          {$set:{'value': relation.tie.me,'timestamp': new Date().getTime()}}
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
    'tie': {
      me: me.value,
      friend: friend.value
    },
    'timestamp': new Date().getTime(),
    'maturity': 0 
  },function(err,id) {
    IoT.Logger.log('info','create the follow relationship of','me:',me.pid,' and friend:',friend.pid);
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
      devid: devid,
      about: device.about,
      connector: device.connector,
      controller: device.controller,
      icon: device.icon
    };

    IoT.Device.devices.insert(dev,function(err,result) {
      if(err) return cb(err);

      _.each(device.properties,function(property) {
        property.pid = IoT.uuid();
        property.devid = devid;
        property.timestamp = new Date().getTime();
        property.role = 'newcomer';

        IoT.Device.properties.insert(property,function(err,result) {
          if(err) return cb(err);
          IoT.Logger.log('info','add property ', property);
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
    var relations;
    var now = new Date().getTime();
    var friends = IoT.Device.properties.find({ 
      $and: [
        {'timestamp': {$gt: (now - 60*1000)}},
        {'timestamp': {$lt: now}},
        {'role': {$ne: 'newcomer'}}
      ]
    });

    var me = IoT.Device.properties.findOne({
      'devid': property.devid,
      'service': property.service,
      'property': property.property
    });

    if(me.value === property.value)
      return;
    
    IoT.Device.properties.update(
      {'_id':me._id},
      {$set:{'value': property.value,'timestamp': now, 'role': 'veteran'}}
    );

    me.value = property.value;
    IoT.Logger.log('info','adjust property',me);
    friends.forEach(function(friend)  {
      IoT.Logger.log('info','find a friend',friend);
      relations = IoT.Home.relations.findOne({
        'me': me.pid,
        'friend': friend.pid,
        'tie': {
          'me': me.value,
          'friend': friend.value
        }
      });

      IoT.Logger.log('info','find relation',relations);
      if(relations !== undefined)
        return;

      follow(friend,me);

      relations = IoT.Home.relations.find({
        'friend': friend.pid,
        'tie.friend': friend.value,
        'friendship': {$gt: 0}
      });

      relations.forEach(function(relation) {
        if((relation.friendship - 1 ) <= 0) {
          // remove follower
          IoT.Logger.log('info','remove follower',relation);
          IoT.Home.followers[relation._id].stop();
          delete IoT.Home.followers[relation._id];
          IoT.Home.relations.remove({_id: relation._id});
        } else {
          // decrease friendship
          IoT.Logger.log('info','decrease friendship',relation);
          IoT.Home.relations.update(
            {'_id': relation._id},
            {$inc: {'friendship': -1}}
          );
        }
      });
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

