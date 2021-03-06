(function() {
  angular.module('fl.meteor').factory('GridHelper', GridHelper);
  GridHelper.$inject = ['Dialog', 'LoadingIndicator', 'Toast'];
  function GridHelper(Dialog, LoadingIndicator, Toast) {
    return {
      factory: {
        remove: remove,
        removeSelected: removeSelected
      },

      attachNeedLoadMoreData: attachNeedLoadMoreData,
      attachAfterCellEdit: attachAfterCellEdit,
      attachAutorun: attachAutorun,
      attachWatchQuery: attachWatchQuery,

      generateGridOptions: generateGridOptions
    };

    function generateGridOptions(source) {
      return _.defaults(source, {
        enableFooterTotalSelected: true,
        enableRowSelection: true,
        enableSelectAll: true,
        enableInfiniteScroll: true,
        selectionRowHeaderWidth: 35,
        rowHeight: 35,
        showGridFooter: true,
        infiniteScrollRowsFromEnd: 40,
        multiSelect: true,
        columnDefs: [],
        data: []
      });
    }

    function attachAutorun(context, gridApi, subscribeKey, counterKey) {
      context.autorun(function(computation) {
        var limit = context.getReactively("limit");
        var query = context.getReactively("query", true);
        gridApi.infiniteScroll.saveScrollPercentage();
        LoadingIndicator.start();

        context.subscribe(subscribeKey, function() {
          return [query, limit];
        }, {
          onReady: function() {
            context.totalCounts = Counts.findOne(counterKey);
            LoadingIndicator.stop();
            gridApi.infiniteScroll.dataLoaded(false, !isLast(context.totalCounts, context.gridOptions));
          },
          onStop: function(error) {
          }
        });
      });
    }

    function isLast(totalCounts, gridOptions) {
      if(!gridOptions.data) {
        return false;
      }
      return gridOptions.data.length === 0 || (totalCounts && totalCounts.count !== 0 && gridOptions.data.length === totalCounts.count);
    }

    function confirmRemove($event) {
      return Dialog.confirm("정말 삭제하시겠습니까?", {$event: $event, okLabel: "삭제"});
    }

    function removeSelected(gridApi, fnRemove) {
      return _.wrap(function($event) {
        confirmRemove($event).then(function() {
          var selectedRows = gridApi.selection.getSelectedRows();
          gridApi.selection.clearSelectedRows();
          fnRemove(_.map(selectedRows, "_id")).then(function() {
            Toast.toast("삭제가 되었습니다.");
          }, function(error) {
            _.each(selectedRows, function(rowEntity) {
              gridApi.selection.selectRow(rowEntity);
            });
            onError(error);
          });
        });
      }, checkSelected(gridApi));
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

    function onError(error) {
      Toast.toast("실패 : " + error.reason);
    }

    function attachNeedLoadMoreData($scope, context, gridApi, size) {
      gridApi.infiniteScroll.on.needLoadMoreData($scope, function onNeedLoadMoreData() {
        $log.debug("onNeedLoadMoreData : ", context.limit);
        gridApi.infiniteScroll.dataLoaded(false, false);
        context.limit += size;
      });
    }

    function attachAfterCellEdit($scope, gridApi, fnUpdate) {
      gridApi.edit.on.afterCellEdit($scope, function onAfterCellEdit(rowEntity, colDef, newValue, oldValue) {
          $log.debug(arguments);
          if(newValue === oldValue) {
            return;
          }

          fnUpdate(rowEntity).then(function() {
            Toast.toast("변경에 성공했습니다.");
          }, function(error) {
            onError(error);
            rowEntity[colDef.field] = oldValue;
          });
        }
      );
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

    function attachWatchQuery($scope, gridApi, size) {
      $scope.$watch("query", _.wrap(function() {
        $log.debug("onChangeQuery : ", arguments);
        gridApi.infiniteScroll.resetScroll(false, false);
        context.limit = size;
      }, NUTIL.checkChange), true);
    }
  }
})();