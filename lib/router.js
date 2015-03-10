Router.route('/',function() {
  this.render('iot');
});

Router.route('/device/:devid',function(){
  Session.set('iotDeviceID',this.params.devid);
  this.render('iotDevice');
});


