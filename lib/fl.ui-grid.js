angular.module("fl.ui-grid", []).run(['$$animateJs', '$window', function($$animateJs, $window) {
  $window.$$animateJs = $$animateJs;
}]).factory("UIGridHelper", ["$timeout", "$window", "LoadingIndicator", "$log", function($timeout, $window, LoadingIndicator, $log) {
  return {
    applyLoadMore: applyLoadMore
  };

  function applyLoadMore(context, subscribeName, counterName, gridApi, size, scope) {
    //$log.debug("applyLoadMore", arguments);
    var subscriptionId;
    gridApi.infiniteScroll.on.needLoadMoreData(scope, function() {
      $log.debug("onNeedLoadMoreData");
      gridApi.infiniteScroll.saveScrollPercentage();
      context.limit += size;
      scope.$apply();
    });
    context.searchQuery = context.query;
    var subscribeComputation;
    autorunSubscribe();
    function autorunSubscribe() {
      context.autorun(function(computation) {
        $log.debug("[autorun] subscribe", computation.firstRun);
        LoadingIndicator.start();
        var limit = context.getReactively('limit');
        var query = context.query;
        var subscriptionHandle = context.subscribe(subscribeName, function() {
          return [query, limit];
        }, {
          onReady: function() {
            $log.debug("subscribe onReady :");
          }
        });
        $log.debug("subscriptionHandle.subscriptionId", subscriptionHandle.subscriptionId);
        if(subscriptionId !== subscriptionHandle.subscriptionId) {
        }
        subscriptionId = subscriptionHandle.subscriptionId;
        subscribeComputation = computation;
      });
    }

    context.autorun(function(computation) {
      $log.debug("[autorun] totalCount", computation.firstRun, Counts.get(counterName));
      context.totalCount = Counts.get(counterName);
    });

    var loadCompleteTimer;
    context.autorun(function(computation) {
      var items = context.items;
      $log.debug("[autorun] items", computation.firstRun, items.length);
      (function() {
        $timeout.cancel(loadCompleteTimer);
        loadCompleteTimer = $timeout(loadComplete, 100);
      })();
    });

    context.autorun(function(computation) {
      $log.debug("[autorun] query", computation.firstRun);
      var query = context.getReactively('query', true);
      if(computation.firstRun) {
        return;
      }
      subscribeComputation.stop();
      subscribeComputation.onStop(function() {
        context.limit = size;
        autorunSubscribe();
      });
    });

    function loadComplete() {
      $log.debug("loadComplete");
      LoadingIndicator.stop();
      gridApi.infiniteScroll.dataLoaded(false, !isLast());
    }

    function isLast() {
      var itemLength = context.items.length;
      var limit = context.limit;
      var totalCount = context.totalCount;

      return totalCount <= limit;
      //return itemLength === 0 || itemLength < size || itemLength < limit;
    }
  }
}]);
