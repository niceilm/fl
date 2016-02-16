(function() {
  angular.module("fl.ag-grid", []).run(function() {
    agGrid.initialiseAgGridWithAngular1(angular);
  }).factory("AgGridHelper", AgGridHelper);
  AgGridHelper.$inject = ["$timeout", "$window", "LoadingIndicator", "$filter"];
  function AgGridHelper($timeout, $window, LoadingIndicator, $filter) {
    return {
      valueGetterWithFilter: valueGetterWithFilter,
      valueGetterForJson: valueGetterForJson,
      getJSONStringify: valueGetterForJson,
      cellRenderer: cellRenderer,
      cellRendererForUrl: cellRendererForUrl,
      applyLoadMore: applyLoadMore,
      resizeByWindow: resizeByWindow
    };

    function cellRendererForUrl(params) {
      var url = params.data[params.colDef.field];
      return '<a href="' + url + '" target="_blank">' + url + '</a>';
    }

    function cellRenderer(template) {
      return function(params) {
        return template;
      }
    }

    function valueGetterWithFilter(filter) {
      var args = Array.prototype.slice.call(arguments, 1);
      return function(params) {
        var value = params.data[params.colDef.field];
        return $filter(filter).apply($filter, [value].concat(args));
      }
    }

    function applyLoadMore(context, subscribeName, countKey, api, size) {
      //console.log("applyLoadMore", arguments);
      var subscriptionId;
      var timerData;
      var fnGetRowStyle = api.grid.gridOptions.getRowStyle;
      var dataCompuation;
      api.grid.gridOptions.getRowStyle = getRowStyle;
      context.searchQuery = context.query;
      context.autorun(function(computation) {
        $timeout.cancel(timerData);
        var limit = context.getReactively('limit');
        var query = context.getReactively('searchQuery', true);
        //console.log("[autorun] subscribe");
        var subscriptionHandle = context.subscribe(subscribeName, function() {
          return [query, limit];
        }, {
          onReady: function() {
            context.totalCounts = Counts.findOne(countKey);
            context.autorun(function(computation) {
              dataCompuation = computation;
              var items = context.items;
              //console.log("[autorun] data update");
              $timeout.cancel(timerData);
              timerData = $timeout(serRowData, 50);
            });
          }
        });
        if(subscriptionId !== subscriptionHandle.subscriptionId) {
          LoadingIndicator.start();
          dataCompuation && dataCompuation.stop();
        }
        subscriptionId = subscriptionHandle.subscriptionId;
      });

      context.autorun(function(computation) {
        $timeout.cancel(timerData);
        var query = context.getReactively('query', true);
        if(computation.firstRun) {
          return;
        }
        //console.log("[autorun] watch query");
        context.limit = size;
        context.searchQuery = query;
      });

      function serRowData() {
        //console.log("serRowData");
        var items = context.items;
        if(items) {
          api.setRowData(items);
          LoadingIndicator.stop();
          if(isLast()) {
            return;
          }
          var totalHeight = api.grid.gridOptionsWrapper.getHeaderHeight() + _.sum(api.getRenderedNodes(), api.grid.gridOptionsWrapper.getRowHeightForNode, api.grid.gridOptionsWrapper);
          if(totalHeight < angular.element(api.grid.eUserProvidedDiv).height()) {
            context.limit += size;
          }
        }
      }

      function getRowStyle(params) {
        //console.log("getRowStyle");
        if(!isLast() && params.data._id === _.result(_.last(context.items), "_id") && !LoadingIndicator.isLoading()) {
          context.limit += size;
          //console.log("change limit");
        }
        return (fnGetRowStyle || angular.noop)(params) || {};
      }

      function isLast() {
        var totalCounts = context.totalCounts;
        var itemLength = context.items.length;
        return itemLength === 0 || totalCounts && totalCounts.count !== 0 && itemLength === totalCounts.count;
      }
    }


    function valueGetterForJson(params) {
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
