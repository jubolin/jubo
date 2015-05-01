Router.route('/',function() {
  this.render('iot');
});

Router.route('/device/:devid',function(){
  var dev = judevs.findOne({"devid":this.params.devid});
  Session.set('iotDeviceID',this.params.devid);
  if(dev.controller !== "default")
    this.render(dev.controller);
  else
    this.render('iotDevice');
});


