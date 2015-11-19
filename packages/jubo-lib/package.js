Package.describe({
  name: "jubo:lib",
  summary: "Jubo libraries. ",
  version: "0.27.0",
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.2');

  var packages = [
    'meteor-platform',
    'spacebars',
    'templating',
    'blaze',
    'ddp',
    'http',
    'livedata',
    'mongo',
    'minimongo',
    'reload',
    'session',
    'less',
    'random',
    'iron:router@1.0.7',
    'd3js:d3@3.5.5',
    'infinitedg:winston@0.7.3',
    'twbs:bootstrap-noglyph@3.3.2',
    'natestrauser:font-awesome@4.3.0'
  ];

  api.use(packages);
  api.imply(packages);

  api.addFiles([
    'lib/core.js',
    'lib/jubo.js',
  ],['client','server']);

  api.export([
    'Jubo',
  ]);
});

