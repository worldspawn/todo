module.exports = function (Q) {
  var reservedLifecycles = ['singleton', 'transient'];
  function Builder() {
    this.registrations = {};
    this.flatList = [];
  }

  function recurseDependencies(list, r, walker) {
    if (walker.indexOf(r.name) > -1) {
      throw new Error('Circular dependency detected - ' + r.name);
    }


    for(var i = 0; i < r.injections.length; i++) {
      recurseDependencies(list, list[r.injections[i]], walker.concat([r.name]));
    }
  }

  Builder.prototype = {
    register: function (name, factory, lifecycle, dispose) {
      lifecycle = lifecycle || 'transient';

      if (this.flatList[name]) {
        throw new Error(name + ' is already registered');
      }

      if (!this.registrations[lifecycle]) {
        this.registrations[lifecycle] = {};
      }

      this.registrations[lifecycle][name] = {
        factory : factory,
        name: name,
        lifecycle : lifecycle,
        injections: factory.$inject || [],
        dispose: dispose
      };

      this.flatList[name] = this.registrations[lifecycle][name];
    },
    validate: function () {
      for (var o in this.flatList) {
        if (this.flatList.hasOwnProperty(o)) {
          recurseDependencies(this.flatList, this.flatList[o], []);
        }
      }
    },
    build: function () {
      this.validate();
      return new Lifecycle(null, 'singleton', this.registrations);
    }
  }

  function RequestContext(requestedFrom, promise, name) {
    var self = this;
    this.name = name;
    this.sourcelf = requestedFrom;
    this.lf = new Lifecycle(requestedFrom, 'transient', requestedFrom.registrations);
    this.requestPromise = promise;
    this.requestPromise.fin(function () {
      self.lf.dispose();
    });
  }

  function Cache (allowCache) {
    if (this.allowCache = allowCache) {
      this._cache = {};
    }
  }

  Cache.prototype = {
    get: function (name) {
      if (this.allowCache)
        return this._cache[name];

      return null;
    },
    set: function (name, value) {
      if (this.allowCache) {
        this._cache[name] = value;
      }
    }
  }

  function resolveValue (lf, requestContext, registration, defer, args) {
    var value = registration.factory.apply(lf, args);

    Q.when(value)
      .then(function (x) {
        if (registration.dispose) {
          requestContext.sourcelf.references.push({r: registration, o: x});
        }
        defer.resolve(x);
      })
      .fail(function (err) {
        defer.reject(err);
      });
  }

  function generalFail(defer) {
    return function (err) {
      defer.reject(err);
    }
  }

  function getInternal(name, requestContext, lf) {
    var defer = Q.defer();
    var fail = generalFail(defer);
    var containerHasRegistration = lf.registrations[lf.name] && lf.registrations[lf.name][name]

    if (lf.cache.get(name)) {
      return lf.cache.get(name).promise;
    }

    if (containerHasRegistration) {
      lf.cache.set(name, defer);

      var registration = lf.registrations[lf.name][name];
      var self = this;
      if (registration.injections.length) {
        var index = 0;
        var args = [];

        registration.injections.forEach(function (dep) {
          args.push(getInternal(registration.injections[index++], requestContext, requestContext.lf));
        });

        Q.all(args)
          .then(function (a) {
            resolveValue(lf, requestContext, registration, defer, a);
          })
          .fail(fail);
      }
      else{
        resolveValue(lf, requestContext, registration, defer, []);
      }
    }
    else {
      if (lf.parent) {
        getInternal(name, requestContext, lf.parent)
          .then(function (v) {
            defer.resolve(v);
          })
          .fail(fail);
      }
      else{
        fail('No registration found.');
      }
    }

    return defer.promise;
  }

  function getArray (names, lf) {
    var defer = Q.defer();
    var results = [];

    names.forEach(function (name) {
      results.push(lf.get(name));
    });

    Q.all(results)
      .then(function (r) {
        defer.resolve(r);
      })
      .fail(function (err) {
        defer.reject(err);
      });

    return defer.promise;
  }

  function Lifecycle (parent, name, registrations) {
    this.init(parent, name, registrations);
  }

  Lifecycle.prototype = {
    init: function (parent, name, registrations) {
      this.parent = parent;
      this.name = name;
      this.registrations = registrations;
      this.cache = new Cache(name !== 'transient');
      this.references = [];
    },
    dispose: function () {
      this.references.forEach(function (ref) {
        ref.r.dispose(ref.o);
      });
      this.cache = null;
      this.registrations = null;
      this.parent = null;

    },
    get: function (name) {
      if (name instanceof Array) {
        return getArray(name, this);
      }

      var defer = Q.defer();
      var requestContext = new RequestContext(this, defer.promise, name);

      return getInternal(name, requestContext, requestContext.lf);
    },
    create: function(name) {
      if (reservedLifecycles.indexOf(name) > -1) {
        throw new Error(name + ' is a reserved lifecycle name');
      }
      return new Lifecycle(this, name, this.registrations);
    }
  }

  return Builder;
}
