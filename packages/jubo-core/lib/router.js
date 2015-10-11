Router.route('/',function() {
  this.render('jubo');
});

Router.route('/thing/:tid',function(){
  var dev = judevs.findOne({"tid":this.params.tid});
  Session.set('juboThingID',this.params.tid);
  if(dev.controller !== "default")
    this.render(dev.controller);
  else
    this.render('juboThing');
});


