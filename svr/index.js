var restify = require('restify');
var requireDir = require('require-dir');

var server = restify.createServer({
  name: 'todo'
});

require('./src/startup/loadServices')(server);
require('./src/startup/loadActions')(server);

//TODO: AUTHENTICATION
//TODO: AUTHORIZATION


server.listen(8081, function () {
  console.log('%s listening at %s', server.name, server.url);
});
