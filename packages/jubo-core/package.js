Package.describe({
  name: "jubolin:jubo-core",
  summary: "Jubo core package",
  version: "0.27.0",
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.2');
  //api.use('meteor-platform');
  //api.use('meteor-base');
  //api.use('binary-heap');
  //api.use('check');
  //api.use('ddp');
  //api.use('fastclick');
  //api.use('http');
  //api.use('livedata');
  //api.use('mongo');
  //api.use('reload');
  //api.use('session');
  //api.use('url');
  //api.use('retry');
  //api.use('less');
  //api.use('random');
  api.use('iron:router@1.0.7');
  api.use('d3js:d3@3.5.5');
  api.use('infinitedg:winston@0.7.3')
  api.use('twbs:bootstrap-noglyph@3.3.2');
  api.use('natestrauser:font-awesome@4.3.0')

  api.addFiles([
    'server/iot.js'
  ], ['server']);

  api.addFiles([
    'lib/router.js',
    'collection/jubo.js',
  ],['client','server']);

  api.addFiles([
    'client/d3.iot.js',
    'client/iot.html',
    'client/iot.js',
    'client/main.html',
    'client/less/iot.less'
  ],['client']);
});

