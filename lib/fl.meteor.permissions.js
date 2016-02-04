(function() {
  angular
    .module('fl.meteor.permissions', ['fl.meteor', 'ui.router'])
    .factory('CheckPermission', CheckPermissionFactory)
    .run(run)
    .constant('AUTH_REQUIRED_STATE', '')
    .constant('FORBIDDEN_STATE', '')
    .constant('UNAUTHORIZED_STATE', '')
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

  run.$inject = ['$state', 'CheckPermission', '$rootScope', 'Toast', 'AUTH_REQUIRED_STATE', 'FORBIDDEN_STATE', 'UNAUTHORIZED_STATE'];
  function run($state, CheckPermission, $rootScope, Toast, AUTH_REQUIRED_STATE, FORBIDDEN_STATE, UNAUTHORIZED_STATE) {
    $rootScope.$on('$stateChangeStart', $stateChangeStart);
    $rootScope.$on("$stateChangeError", $stateChangeError);

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

    function $stateChangeError(event, toState, toParams, fromState, fromParams, error) {
      switch(error) {
        case "AUTH_REQUIRED":
          Toast.toast('로그인이 필요합니다.');
          checkAndGo(AUTH_REQUIRED_STATE);
          break;
        case "FORBIDDEN":
          Toast.toast('접근이 금지 되었습니다.');
          checkAndGo(FORBIDDEN_STATE);
          break;
        case "UNAUTHORIZED":
          Toast.toast('권한이 없습니다.');
          checkAndGo(UNAUTHORIZED_STATE);
          break;
        default:
          if(!checkAndGo(error)) {
            Toast.toast('에러가 발생했습니다.');
          }
      }
    }

    function checkAndGo(target) {
      if($state.get(target)) {
        $state.go(target);
        return true;
      }
      return false;
    }
  }
})();