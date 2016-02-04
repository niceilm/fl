(function() {
  angular.module('fl.meteor', ['angular-meteor'])
    .factory('MeteorHelper', ['$q', '$meteorUtils', function($q, $meteorUtils) {
      return {
        stripDollarPrefixedKeys: stripDollarPrefixedKeys,
        excludeAngularKey: stripDollarPrefixedKeys,
        callPromise: callPromise
      };

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
    }]);
})();
