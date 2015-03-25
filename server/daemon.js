Meteor.startup(function() {
  var now = new Date().getTime(); 

  judevs.remove({});
  judevs.insert({ "devid" : "P28nMQedRNHmSiPAN", "location" : "home.parlour", "type" : "lighting", "connector" : "alljoyn", "name" : "客厅", "status" : "on", "startTime": now, "statusColor" : "#008000", "icon" : "lighting-bulb.svg" });
  judevs.insert({"devid" : "P28nMQedRNHmSiPAA", "location" : "home.parlour", "type" : "media", "connector" : "alljoyn", "name" : "电视", "status" : "on", "startTime": now, "statusColor" : "#008000", "icon" : "media-video.svg"});
  judevs.insert({"devid" : "P28nMQedRNHmSiPAB", "location" : "home.parlour", "type" : "sensor", "connector" : "alljoyn", "name" : "门铃", "status" : "on", "startTime": now, "statusColor" : "#008000", "icon" : "sensor-door.svg"});
  judevs.insert({"devid" : "P28nMQedRNHmSiPAC", "location" : "home.parlour", "type" : "switch", "connector" : "alljoyn", "name" : "插座", "status" : "off", "startTime": "doom","statusColor" : "#cccccc", "icon" : "switch-onoff.svg"});

  juhome.remove({});
  juhome.insert({ "authorized" : [  "ntftest" ], "devid" : "P28nMQedRNHmSiPAN", "location" : "home.parlour", "method" : "adjustBrightness", "property" : "brightness", "service" : "lighting", "value" : "100", "label" : "亮度"});
  juhome.insert({ "authorized" : [  "ntftest" ], "devid" : "P28nMQedRNHmSiPAN", "location" : "home.parlour", "method" : "adjustColor", "property" : "color", "service" : "lighting", "value" : "#ffefdb", "label" : "颜色"});
});
