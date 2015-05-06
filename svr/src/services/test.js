function test () {
  console.log('creating test');
  return { test: new Date() };
}
test.$lifecycle = 'singleton';

module.exports = test;
