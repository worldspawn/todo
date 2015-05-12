var MongoClient = require('mongodb').MongoClient;
var Q = require('q');

module.exports = function () {
  var defer = Q.defer();
  var url = 'mongodb://localhost:27017/todo';
// Use connect method to connect to the Server
  MongoClient.connect(url, function(err, db) {
    if (err) {
      defer.reject(err);
      return;
    }

    defer.resolve(db);
    console.log("Connected correctly to server");
  });

  return defer.promise;
}

module.exports.$lifecycle = 'singleton';
module.exports.$onDispose = function (db) {
  db.close();
}
