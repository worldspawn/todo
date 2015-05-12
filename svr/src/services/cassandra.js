var cassandra = require('cassandra-driver');
var Q = require('q');

module.exports = function (config) {
  var client = new cassandra.Client({contactPoints: [config.db.address], keyspace: config.db.name});
  return Q.when(client);
}

module.exports.$inject = ['config'];
