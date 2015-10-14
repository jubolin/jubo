Package.describe({
  name: "jubo:core",
  summary: "Jubo core package",
  version: "0.27.0",
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.2');

  var packages = [
    'jubo:lib@0.27.0', 
  ];

  api.use(packages);
  api.imply(packages);

  api.addFiles([
    'lib/server/iot.js'
  ], ['server']);

  api.addFiles([
    'lib/router.js',
  ],['client','server']);

  api.addFiles([
    'lib/client/d3.iot.js',
    'lib/client/iot.html',
    'lib/client/iot.js',
    'lib/client/main.html',
    'lib/client/less/iot.less',
    //'public/images/thing.bkg.svg',
    //'public/images/devices/lighting-bulb.svg',
    //'public/images/devices/media-video.svg',
    //'public/images/devices/sensor-door.svg',
    //'public/images/devices/sensor-gesture.svg',
    //'public/images/devices/switch-onoff.svg'
  ],['client']);

  api.export([
  ]);
});

