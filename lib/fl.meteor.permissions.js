(function() {
  angular
    .module('fl.meteor.permissions', ['fl.meteor', 'ui.router'])
    .factory('CheckPermission', CheckPermissionFactory)
    .run(run)
  ;

  CheckPermissionFactory.$inject = ['$q', '$timeout'];
  function CheckPermissionFactory($q, $timeout) {
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
  }

  run.$inject = ['$state', 'CheckPermission', '$rootScope'];
  function run($state, CheckPermission, $rootScope) {
    $rootScope.$on('$stateChangeStart', $stateChangeStart);

    Tracker.autorun(function(c) {
      Meteor.user();
      if(c.firstRun) {
        return;
      }
      CheckPermission($state.current.name).then(function() {
      }, function(error) {
        $state.reload($state.current);
      });
    });

    function $stateChangeStart(event, toState, toParams, fromState, fromParams) {
      CheckPermission(toState.name).then(function() {
      }, function(error) {
        event.preventDefault();
        $rootScope.$broadcast('$stateChangeError', toState, toParams, fromState, fromParams, error);
      });
    }
  }
})();