/**
 * @namespace JuBo
 * @summary The namespace for all JuBo.related methods and classes.
 */

JuBo = {};

JuBo.Things = {};
JuBo.Things.followers = {};
JuBo.Things.devices = judevs;
JuBo.Things.relations = jurelations;
JuBo.Things.properties = juproperties;

JuBo.Logger = Winston; 

Meteor.publish("jubo_things_devices",function(){
  return JuBo.Things.devices.find();
});

Meteor.publish("jubo_things_properties",function(){
  return JuBo.Things.properties.find();
});

JuBo.Things.get = function(devid) {
  return JuBo.Things.devices.findOne({'devid':devid});
};

JuBo.Things.installDevice = function(devid,location) {
  JuBo.Things.devices.update({devid:devid},{$set:{'location': location}});
  JuBo.Things.properties.update({devid:devid},{$set:{'location': location}},{multi:true});
};

JuBo.Things.authorize = function(app,locations) {
  _.each(locations,function(location) {
    JuBo.Logger.log('info',app, ' authorized to ', location);
    JuBo.Things.properties.update({'location':location},{$addToSet: {'authorized': app}},{multi:true});
    // ToDo 细粒度的权限控制
    JuBo.Things.properties.allow({
      update: function(userId,doc) {
        return true;
      }
    });
  });
};

JuBo.uuid = function() {
  return Random.id();
}
var survived = function(rules) {
  return true;
};

var follow = function(friend,me) {
  var handler = JuBo.Things.properties.find({'pid': friend.pid}).observeChanges({
    changed: function(id,property) {

      var query = {'me': me.pid,'friend': friend.pid,'tie':{'me': me.value,'friend': friend.value}};
      var relation = JuBo.Things.relations.findOne(query);

      JuBo.Logger.log('info','property',property,'changed.');
      JuBo.Logger.log('info','found the relationship',query);

      if(property.value === relation.tie.friend) { 
        JuBo.Logger.log('info','increase friendship', relation);
        JuBo.Things.relations.update(
          {'_id': relation._id},
          {$inc: {'friendship': 1}}
        );

        // update me
        JuBo.Things.properties.update(
          {'_id': me._id},
          {$set:{'value': relation.tie.me,'timestamp': new Date().getTime()}}
        );
      }
    }
  });
      
    // gather survival rules
  _.each(me.rules, function(rule) {
    var property = JuBo.Things.properties.find({'pid': rule.pid});
    rule.value = property.value;
    JuBo.Logger.log('info','gather rule',rule);
  });

  JuBo.Things.relations.insert({
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
    JuBo.Logger.log('info','create the follow relationship of','me:',me.pid,' and friend:',friend.pid);
    JuBo.Things.followers[id] = handler;
  });

  JuBo.Things.properties.update(
    {'_id': me._id},
    {$set: {'rules': me.rules}}
  );
};

var getStatusColor = function(status) {
  var color = '#cccccc';
  switch(status) {
    case 'on':
      color = '#008000';
      break;
    case 'off':
      color = '#cccccc';
      break;
    default:
      color = '#cccccc';
  }

  return color;
};

var checkDevice = function(property) {
  var pairs = {};
  if(property.service === 'switch' && property.property === 'status') {
    pairs.status = property.value;
    pairs.statusColor = getStatusColor(property.value);
    if(property.value === 'on')
      pairs.startTime = new Date().getTime();

    JuBo.Things.devices.update({'devid': property.devid},{$set: pairs});
  }
};

Meteor.methods({
  add: function(device) {
    var devid = JuBo.uuid();
    var dev = {
      devid: devid,
      about: device.about,
      connector: device.connector,
      controller: device.controller,
      icon: device.icon,
      status : 'off',
      statusColor: '#cccccc',
    };

    JuBo.Things.devices.insert(dev,function(err,result) {
      if(err) return cb(err);

      _.each(device.properties,function(property) {
        property.pid = JuBo.uuid();
        property.devid = devid;
        property.timestamp = new Date().getTime();
        property.role = 'newcomer';

        JuBo.Things.properties.insert(property,function(err,result) {
          if(err) return cb(err);
          JuBo.Logger.log('info','add property ', property);
        });
      });
    });

    Meteor.publish('jubo_things_device_' + dev.devid, function(devid) {
      var self = this;
      var handler = JuBo.Things.properties.find({'devid':devid},{fields: {'label': 0}}).observe({
        added: function(doc) {
          self.added('jubo_things_properties',doc._id,doc);
        },

        changed: function(doc) {
          self.changed('jubo_things_properties',doc._id,doc);
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
    var friends = JuBo.Things.properties.find({ 
      $and: [
        {'timestamp': {$gt: (now - 60*1000)}},
        {'timestamp': {$lt: now}},
        {'role': {$ne: 'newcomer'}}
      ]
    });

    var me = JuBo.Things.properties.findOne({
      'devid': property.devid,
      'service': property.service,
      'property': property.property
    });

    if(me.value === property.value)
      return;

    checkDevice(property);
    
    JuBo.Things.properties.update(
      {'_id':me._id},
      {$set:{'value': property.value,'timestamp': now, 'role': 'veteran'}}
    );

    me.value = property.value;
    JuBo.Logger.log('info','adjust property',me);
    friends.forEach(function(friend)  {
      JuBo.Logger.log('info','find a friend',friend);
      relations = JuBo.Things.relations.findOne({
        'me': me.pid,
        'friend': friend.pid,
        'tie': {
          'me': me.value,
          'friend': friend.value
        }
      });

      JuBo.Logger.log('info','find relation',relations);
      if(relations !== undefined)
        return;

      follow(friend,me);

      relations = JuBo.Things.relations.find({
        'friend': friend.pid,
        'tie.friend': friend.value,
        'friendship': {$gt: 0}
      });

      relations.forEach(function(relation) {
        if((relation.friendship - 1 ) <= 0) {
          // remove follower
          JuBo.Logger.log('info','remove follower',relation);
          JuBo.Things.followers[relation._id].stop();
          delete JuBo.Things.followers[relation._id];
          JuBo.Things.relations.remove({_id: relation._id});
        } else {
          // decrease friendship
          JuBo.Logger.log('info','decrease friendship',relation);
          JuBo.Things.relations.update(
            {'_id': relation._id},
            {$inc: {'friendship': -1}}
          );
        }
      });
    });
  },

  feedback: function(err,property) {
    if(err && property) {
      JuBo.Things.properties.update({'devid': property.devid},{$set:{'value': value}});
    }
  },

  remove: function(devid) {
    JuBo.Things.devices.remove({'devid':devid});
    JuBo.Things.properties.remove({'devid':devid});
  },

  createHomeSlice: function(name) {
    JuBo.Logger.log('info','create slice',name);
    Meteor.publish('jubo_things_slice_' + name,function(name) {
      var self = this;
      var handler = JuBo.Things.properties.find({'authorized':name},{fields: {'authorized':0}}).observe({
        added: function(doc) {
          self.added('jubo_things_properties',doc._id,doc);
          //console.log('publish added:',doc);
        },
        changed: function(doc) {
          self.changed('jubo_things_properties',doc._id,doc);
          //console.log('publish changed:',doc);
        }
      });

      self.ready();
    });
  },

  requestAuthorization: function(app,locations) {
    JuBo.Logger.log('info','Application',app,'request authorization',locations);
  }
});

