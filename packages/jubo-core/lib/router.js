Router.route('/',function() {
  this.render('jubo');
});

Router.route('/thing/:tid',function(){
  var thing = juthings.findOne({"tid":this.params.tid});
  Session.set('juboThingID',this.params.tid);
  if(thing.controller !== "default")
    this.render(thing.controller);
  else
    this.render('juboThing');
});


