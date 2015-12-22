
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

