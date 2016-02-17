angular.module("fl.ui-grid", []).run(['$$animateJs', '$window', function($$animateJs, $window) {
  $window.$$animateJs = $$animateJs;
}]).factory("UIGridHelper", ["$timeout", "$window", "LoadingIndicator", "$log", function($timeout, $window, LoadingIndicator, $log) {
  return {
    applyLoadMore: applyLoadMore
  };

  function applyLoadMore(context, subscribeName, counterName, gridApi, size, scope) {
    var subscribeComputation = {stop: angular.noop};
    var isFirstLoad = true;
    autorunSubscribe();

    context.autorun(function(computation) {
      $log.debug("[autorun] totalCount", computation.firstRun, Counts.get(counterName));
      if(computation.firstRun) {
        return;
      }
      context.totalCount = Counts.get(counterName);
      gridApi.infiniteScroll.dataLoaded(false, !isLast());
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

    function autorunSubscribe() {
      context.autorun(function(computation) {
        subscribeComputation = computation;
        $log.debug("[autorun] subscribe", computation.firstRun);
        LoadingIndicator.start();
        var limit = context.getReactively('limit');
        var query = context.query;
        context.subscribe(subscribeName, function() {
          return [query, limit];
        }, {
          onReady: function() {
            $log.debug("subscribe onReady :");
            autorunItems();
          }
        });
      });
    }

    function registerLoadMore() {
      if(!isFirstLoad) {
        return;
      }
      isFirstLoad = false;
      gridApi.infiniteScroll.on.needLoadMoreData(scope, function() {
        $log.debug("onNeedLoadMoreData");
        gridApi.infiniteScroll.saveScrollPercentage();
        context.limit += size;
        scope.$apply();
      });

    }

    function autorunItems() {
      var loadCompleteTimer;
      context.autorun(function(computation) {
        var items = context.items;
        $log.debug("[autorun] items", computation.firstRun, items.length);
        (function() {
          $timeout.cancel(loadCompleteTimer);
          loadCompleteTimer = $timeout(angular.bind(this, loadComplete, computation), 100);
        })();
      });
    }

    function loadComplete(computation) {
      $log.debug("loadComplete");
      LoadingIndicator.stop();
      computation.stop();
      computation.onStop(function() {
        gridApi.infiniteScroll.dataLoaded(false, !isLast());
        registerLoadMore();
      })
    }

    function isLast() {
      var limit = context.limit;
      var totalCount = context.totalCount;
      return totalCount === 0 || totalCount <= limit;
    }
  }
}]);
