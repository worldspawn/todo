module.exports = function (server) {
  var requireDir = require('require-dir');
    var serviceDefinitions = requireDir('../services');
  var Q = require('q');
  var Builder = require('../lib/di')(Q);

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
  server.$container = container;

  function DiWrapper(container) {
    this.$container = container;
  }

  DiWrapper.prototype = {
    get: function(name) {
      var response = this.$container.get(name);
      return response;
    }
  }

  server.use(function (req, res, next) {
    var nested = container.create('request');
    req.$di = new DiWrapper(nested);
    next();
  });

  server.on('after', function (req) {
    if (req.$di) {
      req.$di.$container.dispose();
      delete req.$di;
    }
  });
};
