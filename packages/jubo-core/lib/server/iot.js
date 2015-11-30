/**
 * @namespace Jubo
 * @summary The namespace for all Jubo.related methods and classes.
 */

var Jubolin = DDP.connect('http://localhost:3000');
console.log("Jubolin satus:",Jubolin.status());
Jubolin.call('whoami',{
  'uuid': Meteor.settings.uuid,
  'token': Meteor.settings.token
});

var Things = new Mongo.Collection('jubolin_iot_things', {connection: Jubolin});
var Properties = new Mongo.Collection('jubolin_iot_things_properties', {connection: Jubolin});

Jubolin.subscribe('group', {'gateway': Meteor.settings.uuid}, function() {
  console.log('subdevice count: ',Things.find().count());
  Things.find({'gateway': Meteor.settings.uuid}).observe({
    added: function(device) {
      console.log("jubolin add device:",device);
      if(Jubo.Things.devices.find({'tid': device.tid}).count() === 0) {
        Jubolin.call('updateThingStatus', device.tid, 'updating');
        // Download device's connector
        // Config device 
      }

      Jubolin.call('updateThingStatus', device.tid, 'loading', Meteor.settings.token);
      device.status = 'offline';
      addDevice(device);
      Jubolin.call('updateThingStatus', device.tid, 'offline', Meteor.settings.token);
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
    changed: function(id, fields) {
      var property = {
        'pid' : id,
        'value': fields.value
      };
      console.log('adjust property: ', id, fields);
      adjustProperty(property);
    }
  });
});


Jubo.Logger = Winston; 
/*Meteor.startup(function() {
  var now = new Date().getTime();

  juthings.remove({});
  juthings.insert({
    'tid': 'P28nMQedRNHmSiPAN',
    'about': {
      'name': '客厅灯',
      'type': 'bulb',
      'location': 'home.parlour',
    },
    'connector': 'alljoyn',
    'status': 'on',
    'startTime': now,
    'statusColor': '#008000',
    'icon': 'lighting-bulb.svg',
    'controller': 'default'
  });
});
*/

Meteor.publish("Jubo_things_devices",function(){
  return Jubo.Things.devices.find();
});

Meteor.publish("Jubo_things_properties",function(){
  return Jubo.Things.properties.find();
});

/*Jubo.Things.get = function(tid) {
  return Jubo.Things.devices.findOne({'tid':tid});
};
*/

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

/*Jubo.uuid = function() {
  return Random.id();
}
*/
var survived = function(rules) {
  return true;
};

var follow = function(friend,me) {
  var handler = Jubo.Things.properties.find({'pid': friend.pid}).observeChanges({
    changed: function(id,property) {

      var query = {'me': me.pid,'friend': friend.pid,'tie':{'me': me.value,'friend': friend.value}};
      var relation = Jubo.Things.relations.findOne(query);

      Jubo.Logger.log('info','property',property,'changed.');
      Jubo.Logger.log('info','found the relationship',query);

      if(property.value === relation.tie.friend) { 
        Jubo.Logger.log('info','increase friendship', relation);
        Jubo.Things.relations.update(
          {'_id': relation._id},
          {$inc: {'friendship': 1}}
        );

        // update me
        Jubo.Things.properties.update(
          {'_id': me._id},
          {$set:{'value': relation.tie.me,'timestamp': new Date().getTime()}}
        );
      }
    }
  });
      
    // gather survival rules
  _.each(me.rules, function(rule) {
    var property = Jubo.Things.properties.find({'pid': rule.pid});
    rule.value = property.value;
    Jubo.Logger.log('info','gather rule',rule);
  });

  Jubo.Things.relations.insert({
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
    Jubo.Logger.log('info','create the follow relationship of','me:',me.pid,' and friend:',friend.pid);
    Jubo.Things.followers[id] = handler;
  });

  Jubo.Things.properties.update(
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

    Jubo.Things.devices.update({'devid': property.devid},{$set: pairs});
  }
};

var evolve = function(me) {
  var relations;
  var now = new Date().getTime();
  var friends = Jubo.Things.properties.find({ 
    $and: [
      {'timestamp': {$gt: (now - 60*1000)}},
      {'timestamp': {$lt: now}},
      {'role': {$ne: 'newcomer'}}
    ]
  });

  friends.forEach(function(friend)  {
    Jubo.Logger.log('info','find a friend',friend);
    relations = Jubo.Things.relations.findOne({
      'me': me.pid,
      'friend': friend.pid,
      'tie': {
        'me': me.value,
        'friend': friend.value
      }
    });

    Jubo.Logger.log('info','find relation',relations);
    if(relations !== undefined)
      return;

    follow(friend,me);

    relations = Jubo.Things.relations.find({
      'friend': friend.pid,
      'tie.friend': friend.value,
      'friendship': {$gt: 0}
    });

    relations.forEach(function(relation) {
      if((relation.friendship - 1 ) <= 0) {
        // remove follower
        Jubo.Logger.log('info','remove follower',relation);
        Jubo.Things.followers[relation._id].stop();
        delete Jubo.Things.followers[relation._id];
        Jubo.Things.relations.remove({_id: relation._id});
      } else {
        // decrease friendship
        Jubo.Logger.log('info','decrease friendship',relation);
        Jubo.Things.relations.update(
          {'_id': relation._id},
          {$inc: {'friendship': -1}}
        );
      }
    });
  });
}

var addDevice = function(device) {
  var dev = {
      tid: device.tid,
      controller: device.controller,
      logoURL: device.logoURL,
      status : device.status,
      statusColor: '#cccccc',
    };

    Jubo.Things.devices.insert(dev,function(err,result) {
      if(err) return cb(err);

      _.each(device.properties,function(property) {
        property.pid = Jubo.uuid();
        property.tid = thing.tid;
        property.timestamp = new Date().getTime();
        property.role = 'newcomer';

        Jubo.Things.properties.insert(property,function(err,result) {
          if(err) return cb(err);
          Jubo.Logger.log('info','add property ', property);
        });
      });
    });

    Meteor.publish('Jubo_things_' + dev.tid, function(tid) {
      var self = this;
      var handler = Jubo.Things.properties.find({'tid':tid},{fields: {'label': 0}}).observe({
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

var adjustProperty = function(property) {
   var me;
    
    if(property.pid) {
      me = Jubo.Things.properties.findOne({'pid': property.pid});
      property.tid = me.tid;
      property.service = me.service;
      property.property = me.property;
    }
    else {
      me = Jubo.Things.properties.findOne({
        'tid': property.tid,
        'service': property.service,
        'property': property.property
      });
    }

    if(me.value === property.value)
      return;

    checkDevice(property);
    
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
          //console.log('publish added:',doc);
        },
        changed: function(doc) {
          self.changed('Jubo_things_properties',doc._id,doc);
          //console.log('publish changed:',doc);
        }
      });

      self.ready();
    });
  },

  requestAuthorization: function(app,locations) {
    Jubo.Logger.log('info','Application',app,'request authorization',locations);
  }
});

