//juapps = new Meteor.Collection('juapps');
judevs = new Meteor.Collection('jubo_iot_devices');
juhome = new Meteor.Collection('jubo_iot_properties');

console.log('judevs:',judevs.find().fetch());

