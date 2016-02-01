angular.module('fl.meteor', ['angular-meteor', 'fl.common'])
  .factory('MeteorHelper', ['$q', '$meteorUtils', '$rootScope', '$meteor', function($q, $meteorUtils, $rootScope) {
    return {
      excludeAngularKey: excludeAngularKey,
      checkPermission: checkPermission
    };

    function checkPermission(stateName) {
      var deferred = $q.defer();

      $meteorUtils.autorun($rootScope, function() {
        if(!Meteor.loggingIn() && Roles.subscription.ready() && Permissions.subscription.ready()) {
          if(Permissions.stateHasPermissionByUser(stateName, Meteor.user())) {
            deferred.resolve(true);
          } else {
            deferred.reject(Permissions.getReplaceStateName(stateName) || "UNAUTHORIZED");
          }
        }
      });
      return deferred.promise;
    }

    function excludeAngularKey(source) {
      return angular.fromJson(angular.toJson(source));
    }
  }])
  .run(run);

run.$inject = ['$rootScope', '$meteor'];

function run($rootScope, $meteor) {
}