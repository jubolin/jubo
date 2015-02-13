Template.iotDeviceNav.helpers({
  devices: function() {
    return judevs.find();
  }
});

Template.iotDevice.helpers({
  devices: function() {
    var devs = judevs.find().fetch();
    if(devs) {
      _.each(devs,function(dev) {
        dev.properties = juhome.find({devid:dev.devid});
      });
    }

    console.log('devs',devs);
    return devs;
  }
});


