angular.module('fl.meteor.permissions', ['fl.meteor', 'ui.router'])
  .config(['$lazyLoadHelperProvider', function($lazyLoadHelperProvider) {
    $lazyLoadHelperProvider.setDefaultOptions({
      resolveByInjectConfig: {
        $$checkPermission: function(config) {
          return ['CheckPermission', function(CheckPermission) {
            return CheckPermission(config.self.name);
          }]
        }
      }
    });
  }])
  .factory('CheckPermission', ['$q', '$timeout', function($q, $timeout) {
    return CheckPermission;

    function CheckPermission(stateName) {
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
  }])
  .run(['$state', 'CheckPermission', '$rootScope', '$log', function run($state, CheckPermission, $rootScope, $log) {
    Tracker.autorun(function(computation) {
      $log.debug("[autorun] user");
      Meteor.user();
      if(computation.firstRun) {
        return;
      }
      var current = $state.current;
      if(!current || current.abstract) {
        return;
      }
      CheckPermission(current.name).then(function() {
      }, function(error) {
        $state.reload(current);
      });
    });
  }]);
