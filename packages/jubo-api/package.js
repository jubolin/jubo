Package.describe({
  name: "jubo:core",
  summary: "Jubo core package",
  version: "0.27.0",
});

Package.onUse(function (api) {
  api.versionsFrom('1.1.0.2');
  api.use('iron:router');
  api.use('bootstrap');
});

