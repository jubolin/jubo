Router.route('/',function() {
  this.render('iot');
});

Router.route('/device/:devid',function(){
  var dev = judevs.findOne({"devid":this.params.devid});
  Session.set('iotDeviceID',this.params.devid);
  if(dev.routeTemplate !== "default")
    this.render(dev.routeTemplate);
  else
    this.render('iotDevice');
});


