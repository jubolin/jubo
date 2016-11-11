Router.route('/',function() {
  this.render('jubo');
});

Router.route('/thing/:tid',function(){
  var thing = Jubo.Things.devices.findOne({"tid":this.params.tid});
  console.log('thing:', thing);
  Session.set('juboThingID',this.params.tid);
  this.render('juboThing');
  /*if(thing.controller !== "default")
    this.render(thing.controller);
  else
    this.render('juboThing');
  */
});


