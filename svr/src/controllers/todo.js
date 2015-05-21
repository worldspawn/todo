module.exports =
[
  {
    method: 'get', path: '/todo', inject: ['couchdb'],
    action: function (req, res, next, db) {
      console.log(req.query);
      if (req.query.completingOn) {
        var date = new Date(Date.parse(req.query.completingOn));
        var key = [date.getFullYear(), date.getMonth(), null];
        db.view('items/byDate', { startkey: key }, function (err, data) {
          if (!err) {
            res.send(data);
          }

          next(err, null);
        });
      }
      else {
        db.view('items/all', function (err, data) {
          if (!err) {
            res.send(data);
          }

          next(err, null);
        });
      }
    }
  },
  {
    method: 'get', path: '/todo/:id', inject: ['cassandra'],
    action: function (req, res, next, db) {
      db.execute('select id, name from items where id = ?', [req.params.id],
        function (err, result) {
          if (!err) {
            if (result.rows.length) {
              res.send(result.rows[0])
            }
            else {
              res.send(404);
            }
          }

          next(err, null);
        });
    }
  },
  {
    method: 'post', path: '/todo', inject: ['couchdb'],
    action: function (req, res, next, db) {
      db.save({name: req.body.todo.name, completeBy: req.body.todo.completeBy, doc_type: 'item'},
        function (err, data) {
          if (!err) {
            res.send(data);
          }

          next(err, null);
        });
    }
  },
  {
    method: 'put', path: '/todo/:id', inject: ['cassandra'],
    action: function (req, res, next, db) {
      var id = req.params.id;
      var todo = req.body.todo;
      db.execute('update items set name = ? where id = ?', [todo.name, id],
        function (err, result) {
          if (!err) {
            res.send(200, { id: id, name: todo.name });
          }
        });
    }
  }
];
