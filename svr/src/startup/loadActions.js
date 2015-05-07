module.exports = function (server) {
  var Q = require('q');
  var requireDir = require('require-dir');
  var actionDefinitions = requireDir('../controllers');

  function actionWrapper (action) {
    if (!action.inject) {
      return action.action;
    }

    return function (req, res, next) {
      var args = [req, res, next];
      if (req.$di) {
        var x = req.$di.get(action.inject);
        
        Q.when(x)
          .then(function (x) {
            action.action.apply(action, args.concat(x));
          });
      }
      else {
        next(new Error('req.$di is null or undefined. No DI container found.'));
      }
    }
  }

  for (var actionSet in actionDefinitions) {
    if (!actionDefinitions.hasOwnProperty(actionSet)){
      continue;
    }

    var actions = actionDefinitions[actionSet];
    actions.forEach(function (action) {
      server[action.method](
        { name: action.name, path: action.path },
        actionWrapper(action)
      );
    });
  }
}
