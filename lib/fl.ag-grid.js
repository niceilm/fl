(function() {
  angular.module("fl.ag-grid", []).run(function() {
    agGrid.initialiseAgGridWithAngular1(angular);
  }).factory("AgGridHelper", AgGridHelper);
  AgGridHelper.$inject = ["$timeout", "$window", "LoadingIndicator"];
  function AgGridHelper($timeout, $window, LoadingIndicator) {
    return {
      getJSONStringify: getJSONStringify,
      applyLoadMore: applyLoadMore,
      resizeByWindow: resizeByWindow
    };

    function applyLoadMore(context, subscribeName, countKey, api, size) {
      //console.log("applyLoadMore", arguments);
      var fnGetRowStyle = api.grid.gridOptions.getRowStyle;
      api.grid.gridOptions.getRowStyle = getRowStyle;
      var subscriptionId;
      context.autorun(function() {
        //console.log("[autorun] subscribe");
        var subscriptionHandle = context.subscribe(subscribeName, function() {
          return [context.getReactively('query', true), context.getReactively('limit')];
        }, {
          onReady: function() {
            context.totalCounts = Counts.findOne(countKey);
          }
        });
        if(subscriptionId !== subscriptionHandle.subscriptionId) {
          $timeout(LoadingIndicator.start, 0);
        }

        subscriptionId = subscriptionHandle.subscriptionId;
      });

      var timerData;
      context.autorun(function() {
        //console.log("[autorun] data update");
        var items = context.items;
        $timeout.cancel(timerData);
        timerData = $timeout(serRowData, 500);
      });

      function serRowData() {
        //console.log("serRowData");
        var items = context.items;
        if(context.gridOptions.api && items) {
          context.gridOptions.api.setRowData(items);
          LoadingIndicator.stop();
        }
      }

      function getRowStyle(params) {
        //console.log("getRowStyle");
        var totalCounts = context.totalCounts;
        var itemLength = context.items.length;
        var isLast = itemLength === 0 || totalCounts && totalCounts.count !== 0 && itemLength === totalCounts.count;

        if(!isLast && params.data._id === _.result(_.last(context.items), "_id") && !LoadingIndicator.isLoading()) {
          context.limit += size;
          //console.log("change limit");
        }
        return (fnGetRowStyle || angular.noop)(params) || {};
      }
    }


    function getJSONStringify(params) {
      return JSON.stringify(params.data[params.colDef.field]);
    }

    function resizeByWindow(scope, api) {
      var timer;

      function onResize() {
        $timeout.cancel(timer);
        timer = $timeout(resize, 100);
      }

      function resize() {
        api.sizeColumnsToFit();
      }

      angular.element($window).on('resize', onResize);
      scope.$on('$destroy', function() {
        angular.element($window).off('resize', onResize);
      });

    }
  }
})();
