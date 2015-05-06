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
        action.inject.forEach(function (name) {
          args.push(req.$di.get(name));
        });

        console.log('waiting for args')
        Q.all(args).then(function (x) {
          console.log('running action', action.action);
          action.action.apply(action, x);
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
