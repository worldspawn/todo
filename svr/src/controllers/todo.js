module.exports =
[
  {
    method: 'get', path: '/todo', inject: ['mongo'],
    action: function (req, res, next, mongo) {
      console.log('action!!!', mongo)
      res.send(['hi']);

      next();
    }
  },
  {
    method: 'get', path: '/todo/:id',
    action: function (req, res, next) {
      next();
    }
  }
];
