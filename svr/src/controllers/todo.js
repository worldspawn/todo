var BSON = require('mongodb').BSON,
  ObjectID = require('mongodb').ObjectID,
  cassandra = require('cassandra-driver');

module.exports =
[
  {
    method: 'get', path: '/todo', inject: ['cassandra'],
    action: function (req, res, next, db) {
      db.execute("SELECT id, name FROM items;", function (err, result) {
           if (!err) {
             res.send(result.rows);
           }

           // Run next function in series
           next(err, null);
       });
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
    method: 'post', path: '/todo', inject: ['cassandra'],
    action: function (req, res, next, db) {
      var todo = req.body.todo;
      var id = null;
      if (todo.hasOwnProperty('id')){
        id = todo.id;
      }
      else {
        id = cassandra.types.uuid();
      }
      db.execute('insert into items (id, name) values (?, ?);', [id, todo.name],
        function (err, result) {
          if (!err) {
            res.send(201, { id: id });
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
