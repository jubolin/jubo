Package.describe({
  name: "jubo:tbee",
  summary: "Jubo zigbee package",
  version: "0.1.0",
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.2');

  var packages = [
    'jubo:lib@0.27.0', 
  ];

  api.use(packages);
  api.imply(packages);

  api.addFiles([
    'lib/server/connector.js',
    'lib/server/tbee.js',
  ], ['server']);

  api.addFiles([
  ],['client','server']);

  api.addFiles([
  ],['client']);

  api.export([
    'TBee'
  ]);

  Npm.depends({
    serialport: '1.7.4'
  });
});

