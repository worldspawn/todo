module.exports = function (server) {
  var container = server.$container;
  var dbp = container.get('couchdb');
  dbp.then(function (db) {
    db.save('_design/items', {
      all: {
        map: function (doc) {
          if (doc.doc_type === 'item') {
            emit(null, doc);
          }
        }
      },
      byDate: {
        map: function (doc) {
          if (doc.doc_type === 'item' && doc.completeBy) {
            var date = new Date(Date.parse(doc.completeBy));
            emit([date.getFullYear(), date.getMonth(), date.getDate()], doc);
          }
        }
      },
      overdue: {
        map: function (doc) {
          if (doc.doc_type === 'item' && doc.completeBy && !doc.complete) {
            var date = Date.parse(doc.completeBy);
            var now = Date.now();
            if (date < now) {
              emit(doc.owner, doc);
            }
          }
        }
      }
    });

    //users
    db.save('_design/users', {
      all: {
        map: function (doc) {
          if (doc.doc_type === 'user') {
            emit(null, doc);
          }
        }
      }
    });
  });
};
