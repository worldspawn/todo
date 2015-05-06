module.exports = function (server) {
  var requireDir = require('require-dir');
  var intravenous = require('intravenous');
  var serviceDefinitions = requireDir('../services');
  var Q = require('q');
  var Builder = require('../wuh')(Q);

  var disposeActions = {};

  function onDispose (obj, serviceName) {
    if (disposeActions[serviceName]) {
      disposeActions[serviceName](obj);
    }
  }

  var builder = new Builder();

  for (var serviceName in serviceDefinitions) {
    if (!serviceDefinitions.hasOwnProperty(serviceName)){
      continue;
    }

    var service = serviceDefinitions[serviceName];
    if (service.$onDispose) {
      disposeActions[serviceName] = service.$onDispose;
    }

    builder.register(serviceName, service, service.$lifecycle);
  }

  var container = builder.build();

  server.use(function (req, res, next) {
    var nested = container.create('request');
    req.$di = {
      $container: nested,
      get: function(name) {
        var response = this.$container.get(name);
        return response;
      }
    };
    next();
  });

  server.on('after', function (req) {
    if (req.$di) {
      req.$di.$container.dispose();
    }
  });
};
