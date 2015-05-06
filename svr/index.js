// var Q = require('q');
// var Builder = require('./src/wuh')(Q);

/*function test1 () {
  return 'hello world'
}

function test2 (test1) {
  return 'you said ' + test1;
}
test2.$inject = ['test1'];

function test3a (test3b) {

}
test3a.$inject = ['test3b'];

function test3b (test3a) {

}
test3b.$inject = ['test3a'];

function test4_5() {
  for (var i = 0; i< 10000000; i++){
    //waste time
  }
  return { time: new Date().valueOf() };
}

function test6() {
  return { time: new Date().valueOf() };
}

var b = new Builder();
b.register('test1', test1);
b.register('test2', test2);
b.register('test3a', test3a);
b.register('test3b', test3b);
b.register('test4', test4_5);
b.register('test5', test4_5, 'request');
b.register('test6', test6, 'perdependency');

var lf = b.build();
// var reqlf = lf.create('request');
// lf.get('test1').then(function(x) {
//   console.log(x);
// });
//
// lf.get('test2').then(function(x) {
//   console.log('test2', x);
// });

var xxx = lf.get('test3a');
console.log(xxx);
  xxx
  .then(function() {
    console.log('FAILED TEST3')
  })
  .fail(function (err) {
    console.log('zap', 'test3a', err.message);
  })
  .fin(function() {
    console.log('fin');
  })

//console.log(lf.get('test4'));
//console.log(reqlf.get('test5'));
//reqlf.dispose();
//reqlf = lf.create('request');
// console.log(reqlf.get('test5'));
// console.log(lf.get('test4'));
//
// console.log(reqlf.get('test4'));
//
// console.log('test 6');
// console.log(reqlf.get('test6'));
return;
*/
var restify = require('restify');
var requireDir = require('require-dir');

var server = restify.createServer({
  name: 'todo'
});

require('./src/startup/loadServices')(server);
require('./src/startup/loadActions')(server);

server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});

//console.log(controllers);
// controllers.forEach(function (actions) {
//   console.log(actions);
// });
