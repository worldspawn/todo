var Q = require('q');
var Builder = require('./di')(Q);

function createService(func, dependencies) {
  func.$inject = dependencies;
  return func;
}

describe('di container', function () {
  describe('when a dependency has a dispose callback', function () {
    function componentA() {
      return 'Jazzy Jeff';
    }

    var builder = new Builder();
    var callbackCalled = false;
    builder.register('componentA', componentA, null, function(o) {
      expect(o).toEqual('Jazzy Jeff');
      callbackCalled = true;
    });

    it ('it should call the component callback when the container is disposed', function (done) {
      var container = builder.build();
      container.get('componentA')
        .then(function (ca) {
          container.dispose();
          expect(callbackCalled).toBe(true);
          done();
        });
    });
  });

  describe('when a dependency is registered as \'singleton\'', function () {
    function componentA() {
      return { value : new Date() };
    }
    componentA.$inject = ['componentB'];

    function componentB() {
      return { value : new Date() };
    }

    var container;
    var builder = new Builder();
    builder.register('componentA', componentA, 'singleton');
    builder.register('componentB', componentB);
    container = builder.build();

    it ('separate resolution requests should return the same instance', function (done) {
      container.get(['componentA', 'componentA'])
        .then(function (components) {
          expect(components[0]).toBe(components[1])
        })
        .fail(function (err) {
          expect(err).toBeNull();
        })
        .fin(done);
    });
  });

  describe('when a dependency is registered as \'transient\'', function () {
    function componentA(componentB, componentC) {
      return { componentB: componentB, componentC: componentC };
    }
    componentA.$inject = ['componentB', 'componentC'];

    function componentB() {
      return { value : new Date().valueOf() };
    }

    function componentC(componentB) {
      return { componentB: componentB };
    }
    componentC.$inject = ['componentB'];

    var container;
    var builder = new Builder();
    builder.register('componentA', componentA);
    builder.register('componentB', componentB);
    builder.register('componentC', componentC);
    container = builder.build();

    it ('separate resolution requests should return a new instance', function (done) {
      container.get(['componentA', 'componentA'])
        .then(function (components) {
          expect(components[0]).not.toBe(components[1])
        })
        .fail(function (err) {
          console.log(err.message);
          expect(err).toBeNull();
        })
        .fin(done);
    });

    it('should create new instance of every dependency for each dependency', function (done) {
      container.get(['componentA', 'componentC'])
        .then(function (components) {
          var componentA = components[0];
          var componentC = components[1];
          expect(componentA.componentC).not.toBe(componentC);
          expect(componentA.componentB).not.toBe(componentC.componentB);
          expect(componentA.componentB).not.toBe(componentA.componentC.componentB);
        })
        .fail(function (err) {
          expect(err).toBeNull();
        })
        .fin(done);
    });
  });

  describe('when a component depends on another', function () {
    function componentA(componentB) {
      return 'componentA' + componentB;
    }
    componentA.$inject = ['componentB'];

    function componentB() {
      return 'componentB';
    }

    var container;
    var builder = new Builder();
    builder.register('componentA', componentA);
    builder.register('componentB', componentB);

    beforeEach(function () {
      container = builder.build();
    });

    it ('its dependency is injected', function (done) {
      container.get('componentA')
        .then(function (componentA) {
          expect(componentA).toBe('componentAcomponentB');
        })
        .fail(function (err) {
          expect(err).toBeNull();
        })
        .fin(done);
    });
  });

  describe('when components depend on each other', function () {
    function componentA() {

    }
    componentA.$inject = ['componentB'];

    function componentB() {

    }
    componentB.$inject = ['componentA'];

    var builder = new Builder();
    builder.register('componentA', componentA);
    builder.register('componentB', componentB);

    it ('should fail with circular dependency when building', function () {
      expect(builder.build).toThrow();
    });
  });

  describe('when a complex deep dependency hierarchy is used', function () {
    var mars = createService(
      function (jupiter, venus) {
        return { ticks: new Date().valueOf(), jupiter: jupiter, venus: venus };
      }, ['jupiter', 'venus']);

    var jupiter = createService(
      function (pluto) {
        return { ticks: new Date().valueOf(), pluto: pluto };
      }, ['pluto']);

    var venus = createService(
      function (mercury) {
        return { ticks: new Date().valueOf(), mercury: mercury };
      }, ['mercury']);

    var mercury = createService(
      function (pluto, saturn) {
        return { ticks: new Date().valueOf(), pluto: pluto, saturn: saturn };
      }, ['pluto', 'saturn']);

    var saturn = createService(
      function () {
        return { ticks: new Date().valueOf() };
      }, []);

    var pluto = createService(
      function (saturn) {
        return { ticks: new Date().valueOf(), saturn: saturn };
      }, ['saturn']);

    var container;
    var builder = new Builder();
    builder.register('mars', mars);
    builder.register('jupiter', jupiter);
    builder.register('venus', venus);
    builder.register('mercury', mercury, 'singleton');
    builder.register('saturn', saturn);
    builder.register('pluto', pluto);
    var mars1, mars2;
    container = builder.build();
    beforeEach(function (done) {
      Q.all(container.get(['mars', 'mars']))
        .then(function (v) {
          mars1 = v[0];
          mars2 = v[1];
        })
        .fail(function (err) {
          expect(err).toBeNull();
        })
        .fin(done);
    });

    it ('mars1 not to equal mars2', function () {
      expect(mars1).not.toBe(mars2);
    });

    it ('mars1 singleton mercury reference should equal mars2 mercury reference', function () {
      expect(mars1.venus.mercury).toBe(mars2.venus.mercury);
    });

    it ('perdependency dep of singleton are always the same', function () {
      expect(mars1.venus.mercury.saturn).toBe(mars2.venus.mercury.saturn);
    });

    it ('singleton per dependency will not match perdependency deps for initial resolve amd for subsequence resolves', function () {
      expect(mars1.venus.mercury.pluto).not.toBe(mars1.jupiter.pluto);
      expect(mars2.venus.mercury.pluto).not.toBe(mars2.jupiter.pluto);
    });
  });
});
