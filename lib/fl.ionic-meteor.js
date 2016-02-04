angular.module('fl.ionic-meteor', [
  'angular-meteor',
  'angular-meteor.auth',
  'ionic',
  'LocalForageModule',
  'toastr',
  'fl.lazy'
]).run(["$rootScope", function run($rootScope) {
  $rootScope.settings = Meteor.settings && Meteor.settings.public ? Meteor.settings.public : {};
}]).factory('AgentManager', [function() {
  return {
    isAndroid: isAndroid,
    isIOS: isIOS,
    isMobile: isMobile
  };

  function isAndroid() {
    return ionic.Platform.isAndroid();
  }

  function isIOS() {
    return ionic.Platform.isIOS();
  }

  function isMobile() {
    return (ionic.Platform.isAndroid() || ionic.Platform.isIOS() || ionic.Platform.isWebView());
  }
}]).factory("MeteorHelper", ['$q', '$rootScope', function MeteorHelper($q, $rootScope) {
  return {
    meteorCallReturnValue: meteorCallReturnValue
  };

  function meteorCallReturnValue(methodName) {
    var args = _.toArray(arguments).slice(1);
    var value = [];
    value.$resolve = false;
    var promise = $q(function(resolve, reject) {
      Meteor.apply(methodName, args, function(err, results) {
        if(!err) {
          if(_.isArray(results)) {
            _.forEach(results, function(result) {
              value.push(result);
            });
          } else {
            value.push(results);
          }
          resolve();
        } else {
          reject(err);
        }
        value.$resolve = true;
        $rootScope.$broadcast('scroll.refreshComplete');
        $rootScope.$apply();
      });
    });
    value.$promise = promise;

    return value;
  }
}
]).factory('LoadMoreService', ['$meteor', '$timeout', function($meteor, $timeout) {

  return {
    setLoadMoreAndRefresh: setLoadMoreAndRefresh
  };

  function setLoadMoreAndRefresh(options) {
    check(options, Object);
    check(options.subcribeName, String);
    check(options.counterName, String);
    check(options.collection, Match.OneOf(Function, Object));

    var computation = {invalidate: angular.noop};
    var scope = options.scope;
    var subcribeName = options.subcribeName;
    var counterName = options.counterName;
    var size = options.size || 10;
    var query = options.query || {};
    var collection = options.collection;

    scope.items = scope.$meteorCollection(collection);
    scope.hasMore = true;
    scope.limit = size;

    scope.$meteorAutorun(function onAutorun(_computation) {
      $log.debug("onAutorun", arguments);
      computation = _computation;
      var limit = scope.getReactively("limit");
      scope.$meteorSubscribe(subcribeName, query, limit).then(function() {
        scope.totalCounts = scope.$meteorObject(Counts, counterName, false);
      }).finally(function() {
        scope.hasMore = scope.totalCounts && scope.totalCounts.count !== 0 && scope.items.length !== scope.totalCounts.count;
        scope.$broadcast("scroll.infiniteScrollComplete");
        scope.$broadcast("scroll.refreshComplete");
      });
    });

    scope.doRefresh = function() {
      $log.debug("doRefresh");
      if(scope.limit === size) {
        return $timeout(function() {
          scope.$broadcast("scroll.refreshComplete");
        }, 300);
      }
      scope.hasMore = true;
      scope.limit = size;
      computation.invalidate();
    };

    scope.loadMore = function() {
      scope.limit += size;
    };
  }
}]);