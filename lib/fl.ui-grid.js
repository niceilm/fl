angular.module("fl.ui-grid", []).run(['$$animateJs', '$window', function($$animateJs, $window) {
  $window.$$animateJs = $$animateJs;
}]).factory("UIGridHelper", ["$timeout", "$window", "LoadingIndicator", "$log", "Dialog", "Toast", function($timeout, $window, LoadingIndicator, $log, Dialog, Toast) {
  return {
    applyLoadMore: applyLoadMore,
    removeSelected: removeSelected,
    remove: remove
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

  function remove(gridApi, fnRemove) {
    return function(rowEntity, $event) {
      confirmRemove($event).then(function() {
        var selectedRows = gridApi.selection.getSelectedRows();
        var isSelectRow = !!_.find(selectedRows, rowEntity);
        if(isSelectRow) {
          gridApi.selection.unSelectRow(rowEntity);
        }
        fnRemove([rowEntity._id]).then(function() {
          Toast.toast("삭제가 되었습니다.");
        }, function(error) {
          if(isSelectRow) {
            gridApi.selection.selectRow(rowEntity);
          }
          onError(error);
        });
      });
    }
  }

  function removeSelected(gridApi, fnRemove) {
    return _.wrap(function($event) {
      confirmRemove($event).then(function() {
        var selectedRows = gridApi.selection.getSelectedRows();
        gridApi.selection.clearSelectedRows();
        fnRemove(_.map(selectedRows, "_id")).then(function() {
          Toast.toast("삭제가 되었습니다.");
        }, function(error) {
          angular.forEach(selectedRows, function(rowEntity) {
            gridApi.selection.selectRow(rowEntity);
          });
          onError(error);
        });
      });
    }, checkSelected(gridApi));
  }

  function confirmRemove($event) {
    return Dialog.confirm("정말 삭제하시겠습니까?", {$event: $event, okLabel: "삭제"});
  }

  function checkSelected(gridApi) {
    return function(afterFn) {
      check(afterFn, Function);
      $log.debug("context.gridApi.selection.getSelectedRows() : ", gridApi.selection.getSelectedRows());
      if(gridApi.selection.getSelectedRows().length === 0) {
        return Dialog.alert("최소 한개 이상 선택해주세요.");
      }
      return afterFn.apply(this, Array.prototype.slice.call(arguments, 1));
    }
  }

  function onError(error) {
    Toast.toast("실패 : " + error.reason);
  }
}]);
