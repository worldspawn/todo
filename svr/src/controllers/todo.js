module.exports =
[
  {
    method: 'get', path: '/todo', inject: ['mongo'],
    action: function (req, res, next, db) {
      var todoItems = db.collection('todo');
      todoItems.find({})
        .toArray(function (err, items) {
          if (err) {
            next(err);
            return;
          }

          res.send(items);
          next();
        });
    }
  },
  {
    method: 'get', path: '/todo/:id',
    action: function (req, res, next) {
      next();
    }
  },
  {
    method: 'post', path: '/todo', inject: ['mongo'],
    action: function (req, res, next, db) {
      
      next();
    }
  }
];
