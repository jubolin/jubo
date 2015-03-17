Meteor.startup(function() {
  judevs.remove();
  var devs = [
    {"devid" : "P28nMQedRNHmSiPAN", "location" : "home.parlour", "type" : "lighting", "connector" : "alljoyn", "name" : "客厅", "status" : "running", "statusColor" : "#008000", "icon" : "lighting-bulb.svg"},
    {"devid" : "P28nMQedRNHmSiPAA", "location" : "home.parlour", "type" : "media", "connector" : "alljoyn", "name" : "电视", "status" : "running", "statusColor" : "#008000", "icon" : "media-video.svg"},
    {"devid" : "P28nMQedRNHmSiPAB", "location" : "home.parlour", "type" : "sensor", "connector" : "alljoyn", "name" : "门铃", "status" : "running", "statusColor" : "#008000", "icon" : "sensor-door.svg"},
    {"devid" : "P28nMQedRNHmSiPAC", "location" : "home.parlour", "type" : "switch", "connector" : "alljoyn", "name" : "插座", "status" : "stop", "statusColor" : "#008000", "icon" : "switch-onoff.svg"},
    ];

    var properties = [
      { "authorized" : [  "ntftest" ], "devid" : "P28nMQedRNHmSiPAN", "location" : "home.parlour", "method" : "adjustBrightness", "property" : "brightness", "service" : "lighting", "value" : "100", "lable" : "亮度"},
      { "authorized" : [  "ntftest" ], "devid" : "P28nMQedRNHmSiPAN", "location" : "home.parlour", "method" : "adjustColor", "property" : "color", "service" : "lighting", "value" : "#ffefdb", "lable" : "颜色"}
    ];

    judevs.insert(devs);
    juhome.insert(properties); 
});
