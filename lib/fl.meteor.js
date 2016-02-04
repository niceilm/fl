angular.module('fl.meteor', ['angular-meteor', 'fl.common', 'fl.material'])
  .factory('MeteorHelper', ['$q', '$meteorUtils', '$rootScope', function($q, $meteorUtils, $rootScope) {
    var comp = {stop: angular.noop};
    // stop autorun when scope is destroyed
    $rootScope.$on('$destroy', function() {
      comp.stop();
    });

    return {
      stripDollarPrefixedKeys: stripDollarPrefixedKeys,
      excludeAngularKey: stripDollarPrefixedKeys,
      checkPermission: checkPermission,
      callPromise: callPromise
    };

    function checkPermission(stateName) {
      var deferred = $q.defer();

      comp = Tracker.autorun(function(c) {
        if(!Meteor.loggingIn() && Roles.subscription.ready() && Permissions.subscription.ready()) {
          if(Permissions.stateHasPermissionByUser(stateName, Meteor.user())) {
            deferred.resolve(true);
          } else {
            deferred.reject(Permissions.getReplaceStateName(stateName) || "UNAUTHORIZED");
          }
          c.stop();
        }
        // this is run immediately for the first call
        // but after that, we need to $apply to start Angular digest
        if(!c.firstRun) $timeout(angular.noop, 0);
      });

      return deferred.promise;
    }

    function stripDollarPrefixedKeys(source) {
      return $meteorUtils.stripDollarPrefixedKeys(source);
    }

    function callPromise(name) {
      var args = Array.prototype.slice.call(arguments);
      return $q(function(resolve, reject) {
        args.push(function(error, result) {
          if(error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
        Meteor.call.apply(Meteor, args);
      });
    }
  }])
  .run(run);

run.$inject = ['$rootScope', '$meteor'];

function run($rootScope, $meteor) {
}