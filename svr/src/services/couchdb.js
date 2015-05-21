var cradle = require('cradle');
var Q = require('q');

module.exports = function (config) {
  var defer = Q.defer();
  var db = new (cradle.Connection)(config.db.address, config.db.port, {
    cache: true,
    raw: false,
    forceSave: true
  })
  .database(config.db.name);

  db.exists(function (err, exists) {
    if (err) {
      defer.reject(err);
      return;
    }

    if (exists){
      defer.resolve(db);
    }
    else {
      db.create(function (err) {
        if (err) {
          defer.reject(err);
          return;
        }

        defer.resolve(db);
      });
    }

  });

  return defer.promise;
}

module.exports.$lifecycle = 'singleton';
module.exports.$inject = ['config'];
