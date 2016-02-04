(function() {
  angular.module('fl.meteor.permissions', ['fl.meteor', 'ui.router', 'fl.lazy']).factory('Permissions', ['$q', '$timeout', function($q, $timeout) {
    return {
      checkPermission: checkPermission
    };

    function checkPermission(stateName) {
      var deferred = $q.defer();

      Tracker.autorun(function(c) {
        if(!Meteor.loggingIn() && Roles.subscription.ready() && Permissions.subscription.ready()) {
          if(Permissions.stateHasPermissionByUser(stateName, Meteor.user())) {
            deferred.resolve(true);
          } else {
            deferred.reject(Permissions.getReplaceStateName(stateName) || "UNAUTHORIZED");
          }
          c.stop();
        }
        if(!c.firstRun) {
          $timeout(angular.noop, 0);
        }
      });

      return deferred.promise;
    }
  }]).config(['$lazyLoadHelperProvider', function($lazyLoadHelperProvider) {
    $lazyLoadHelperProvider.setDefaultOptions({
      resolveByInjectConfig: {
        $checkPermission: function(config) {
          return ['Permissions', function(Permissions) {
            return Permissions.checkPermission(config.self.name);
          }]
        }
      }
    });
  }]).run(['$state', 'Permissions', function($state, Permissions) {
    Tracker.autorun(function(c) {
      Meteor.user();
      if(c.firstRun) {
        return;
      }
      if(Permissions.checkPermission($state.current.name) !== true) {
        $state.reload($state.current);
      }
    });
  }]);
})();