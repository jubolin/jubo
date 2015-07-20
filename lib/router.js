Router.route('/',function() {
  this.render('jubo');
});

Router.route('/device/:devid',function(){
  var dev = judevs.findOne({"devid":this.params.devid});
  Session.set('juboDeviceID',this.params.devid);
  if(dev.controller !== "default")
    this.render(dev.controller);
  else
    this.render('juboDevice');
});


