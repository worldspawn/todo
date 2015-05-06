module.exports = function (Q) {
  function Builder() {
    this.registrations = {};
  }

  Builder.prototype = {
    register: function (name, factory, lifecycle) {
      lifecycle = lifecycle || 'perdependency';
      if (!this.registrations[lifecycle]) {
        this.registrations[lifecycle] = {};
      }

      this.registrations[lifecycle][name] = {
        factory : factory,
        name: name,
        lifecycle : lifecycle,
        injections: factory.$inject || []
      };
    },
    build: function () {
      return new Lifecycle(null, 'singleton', this.registrations);
    }
  }

  function RequestContext(requestedFrom, promise) {
    var self = this;
    this.requestedNames = [];
    this.lf = new Lifecycle(requestedFrom, 'perdependency', requestedFrom.registrations);
    this.requestPromise = promise;
    this.requestPromise.fin(function () {
      self.lf.dispose();
    });
  }

  function Lifecycle (parent, name, registrations) {
    this.init(parent, name, registrations);
  }

  Lifecycle.prototype = {
    init: function (parent, name, registrations) {
      this.parent = parent;
      this.name = name;
      this.registrations = registrations;

      this.cache = {};
    },
    dispose: function () {
      this.cache = null;
      this.registrations = null;
      this.parent = null;
    },
    get: function (name, requestContext, isParentWalk) {
      var defer = Q.defer();
      if (name instanceof Array) {
        return this.getArray(name);
      }

      var lf = this;

      if (requestContext) {
        if (!isParentWalk) {
          if (requestContext.requestedNames.indexOf(name) > -1) {
            defer.reject(new Error('Circular dependency detected'));
            return defer.promise;
          }
        }

        requestContext.requestedNames.push(name);
      }
      else {
        requestContext = new RequestContext(this, defer.promise);
        lf = requestContext.lf;
      }

      if (lf.cache[name]) {
        Q.when(lf.cache[name].value)
          .then(function (x) {
            defer.resolve(x);
          })
          .fail(function (err) {
            defer.reject(err);
          });
          return defer.promise;
      }

      var containerHasRegistration = this.registrations[lf.name] && this.registrations[lf.name][name]
      if (containerHasRegistration) {
        var registration = this.registrations[lf.name][name];
        var args = [];
        if (registration.injections.length) {
          var self = this;
          registration.injections.forEach(function (dep) {
            args.push(requestContext.lf.get(dep, requestContext));
          });
        }

        Q.all(args)
          .then(function (deps) {
            var value = registration.factory.apply(this, deps);

            if (value) {
              lf.cache[name] = {
                value : value
              };
            }

            Q.when(value)
              .then(function (x) {
                defer.resolve(x);
              })
              .fail(function (err) {
                defer.reject(err);
              })
          })
          .fail(function (err) {
            console.log('args failed')
            defer.reject(err);
          });
      }
      else {
        if (lf.parent) {
          lf.parent.get(name, requestContext, true)
            .then(function (v) {
              defer.resolve(v);
            })
            .fail(function (err) {
              defer.reject(err);
            });
        }
      }

      return defer.promise;
    },
    getArray: function (names) {
      var defer = Q.defer();
      var result = [];
      var self;
      names.forEach(function (name) {
        result.push(self.get(name));
      });

      Q.all(result)
        .then(function (x) {
          defer.resolve(x);
        })
        .fail(function (err) {
          defer.reject(err);
        })

      return defer.promise;
    },
    create: function(name) {
      if (name == 'singleton') {
        throw new Error('singleton is a reserved lifecycle name');
      }
      if (name == 'perdependency') {
        throw new Error('perdependency is a reserved lifecycle name');
      }
      return new Lifecycle(this, name, this.registrations);
    }
  }

  return Builder;
}
