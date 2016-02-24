angular.module("fl.ui-grid", []).run(['$$animateJs', '$window', function($$animateJs, $window) {
  $window.$$animateJs = $$animateJs;
}]).factory("UIGridBuilder", [function() {
  var UIGridBuilder = function() {
    this.size = 200;
  };
  UIGridBuilder.prototype.setContext = function(context) {
    this.context = context;
    return this;
  };
  UIGridBuilder.prototype.setSize = function(size) {
    this.size = size;
    return this;
  };
  UIGridBuilder.prototype.setPublishName = function(publishName) {
    this.publishName = publishName;
    return this;
  };
  UIGridBuilder.prototype.setGridApi = function(gridApi) {
    this.gridApi = gridApi;
    return this;
  };
  UIGridBuilder.prototype.setScope = function(scope) {
    this.scope = scope;
    return this;
  };
  UIGridBuilder.prototype.build = function() {
    return new UIGridHelper(this);
  };
  return UIGridBuilder;
}]).factory("UIGridHelper", ["$timeout", "$window", "LoadingIndicator", "$log", "Dialog", "Toast", "MeteorHelper", function($timeout, $window, LoadingIndicator, $log, Dialog, Toast, MeteorHelper) {
  var UIGridHelper = function(option) {
    this.context = option.context;
    this.size = option.size;
    this.publishName = option.publishName;
    this.gridApi = option.gridApi;
    this.scope = option.scope;
    this.methodPromise = option.methodPromise;
  };

  UIGridHelper.prototype.attachLoadMoreByMethod = function() {
    var self = this;
    var lastId;
    self.gridApi.infiniteScroll.on.needLoadMoreData(self.scope, load);
    load();
    function load() {
      $log.debug("onNeedLoadMoreData");
      LoadingIndicator.start();
      self.gridApi.infiniteScroll.saveScrollPercentage();
      return self.methodPromise(self.context.query, self.size, lastId).then(function(items) {
        var isLast = false;
        if(items.length === 0) {
          isLast = true;
        } else {
          lastId = items[items.length - 1]._id;
          self.gridApi.grid.options.data = self.gridApi.grid.options.data.concat(items);
        }
        LoadingIndicator.stop();
        return self.gridApi.infiniteScroll.dataLoaded(false, !isLast);
      });
    }
  };
  UIGridHelper.prototype.attachLoadMore = function() {
    var self = this;
    var subscribeComputation = {stop: angular.noop};
    var isFirstLoad = true;
    var isLoadComplete = false;
    var updateItemsTimer;
    self.scope.$on("$destroy", $destroy);
    var unbindWatcher = self.scope.$watchCollection(function() {
      return self.context.items;
    }, onChangeItems);
    autorunSubscribe();

    self.context.autorun(function(computation) {
      $log.debug("[autorun] query", computation.firstRun);
      var query = self.context.getReactively('query', true);
      if(computation.firstRun) {
        return;
      }
      subscribeComputation.stop();
      subscribeComputation.onStop(function() {
        self.gridApi.infiniteScroll.resetScroll(false, true);
        self.context.limit = self.size;
        autorunSubscribe();
      });
    });

    function $destroy() {
      $log.debug("$destroy");
      self.context.items = [];
      unbindWatcher();
    }

    function onChangeItems(newItems, oldItems) {
      var newItemLength = newItems.length;
      var oldItemLength = oldItems.length;
      if(!isLoadComplete) {
        return;
      }
      (function() {
        $timeout.cancel(updateItemsTimer);
        updateItemsTimer = $timeout(function() {
          $log.debug("onChangeItems", newItemLength, oldItemLength);

          if(newItemLength === oldItemLength) {
            console.log("update items!!! moved");
          } else if(newItemLength > oldItemLength) {
            console.log("update items!!! added");
          } else if(newItemLength < oldItemLength) {
            console.log("update items!!! removed");
          }
          updateGridData();
          self.gridApi.infiniteScroll.dataLoaded(false, !isLast());
          LoadingIndicator.stop();
        }, 100);
      })();
    }

    function autorunSubscribe() {
      self.context.autorun(function(computation) {
        subscribeComputation = computation;
        $log.debug("[autorun] subscribe", computation.firstRun);
        LoadingIndicator.start();
        isLoadComplete = false;
        var limit = self.context.getReactively('limit');
        var query = self.context.query;
        self.context.subscribe(self.publishName, function() {
          return [query, limit];
        }, {
          onReady: onReadySubscibe
        });
      });
    }

    function onReadySubscibe() {
      $log.debug("subscribe onReady :");
      self.context.autorun(function(computation) {
        var items = self.context.getReactively('items');
        $log.debug("[autorun] items", computation.firstRun, items.length);
        registerLoadMore();
        updateGridData();
        computation.onStop(function() {
          self.gridApi.infiniteScroll.dataLoaded(false, !isLast());
          LoadingIndicator.stop();
          isLoadComplete = true;
        });
        computation.stop();
      });
    }

    function updateGridData() {
      if(!angular.isArray(self.gridApi.grid.options.data)) {
        self.gridApi.grid.options.data = [];
      }
      var data = self.gridApi.grid.options.data;
      while(data.length) {
        data.pop();
      }

      angular.forEach(self.context.items, function(item, index) {
        data.push(item);
      });
    }

    function registerLoadMore() {
      if(!isFirstLoad) {
        return;
      }
      isFirstLoad = false;
      self.gridApi.infiniteScroll.on.needLoadMoreData(self.scope, function() {
        $log.debug("onNeedLoadMoreData");
        self.gridApi.infiniteScroll.saveScrollPercentage();
        self.context.limit += self.size;
        self.scope.$apply();
      });
    }

    function isLast() {
      return self.context.limit > self.gridApi.grid.options.data.length;
    }
  };

  UIGridHelper.prototype.factoryRemoveSelected = function(fnRemove) {
    var self = this;
    return _.wrap(function($event) {
      self.confirmRemove($event).then(function() {
        var selectedRows = self.gridApi.selection.getSelectedRows();
        self.gridApi.selection.clearSelectedRows();
        fnRemove(_.map(selectedRows, "_id")).then(function() {
          Toast.toast("삭제가 되었습니다.");
          var data = self.gridApi.grid.options.data;
          angular.forEach(selectedRows, function(rowEntity) {
            var index = _.findIndex(data, {_id: rowEntity._id});
            if(index > -1) {
              data.splice(index, 1);
            }
          });
          return selectedRows;
        }, function(error) {
          angular.forEach(selectedRows, function(rowEntity) {
            self.gridApi.selection.selectRow(rowEntity);
          });
          self.onError(error);
        });
      });
    }, self.checkSelected());
  };

  UIGridHelper.prototype.factoryRemove = function(fnRemove) {
    var self = this;
    return function(rowEntity, $event) {
      self.confirmRemove($event).then(function() {
        var selectedRows = self.gridApi.selection.getSelectedRows();
        var isSelectRow = !!_.find(selectedRows, rowEntity);
        if(isSelectRow) {
          self.gridApi.selection.unSelectRow(rowEntity);
        }
        fnRemove([rowEntity._id]).then(function() {
          Toast.toast("삭제가 되었습니다.");
          var data = self.gridApi.grid.options.data;
          var index = _.findIndex(data, {_id: rowEntity._id});
          if(index > -1) {
            data.splice(index, 1);
          }
          return rowEntity;
        }, function(error) {
          if(isSelectRow) {
            self.gridApi.selection.selectRow(rowEntity);
          }
          self.onError(error);
        });
      });
    }
  };

  UIGridHelper.prototype.onError = function(error) {
    Toast.toast("실패 : " + error.reason);
  };

  UIGridHelper.prototype.checkSelected = function() {
    var self = this;
    return function(afterFn) {
      check(afterFn, Function);
      $log.debug("context.gridApi.selection.getSelectedRows() : ", self.gridApi.selection.getSelectedRows());
      if(self.gridApi.selection.getSelectedRows().length === 0) {
        return Dialog.alert("최소 한개 이상 선택해주세요.");
      }
      return afterFn.apply(this, Array.prototype.slice.call(arguments, 1));
    }
  };

  UIGridHelper.prototype.confirmRemove = function($event) {
    return Dialog.confirm("정말 삭제하시겠습니까?", {$event: $event, okLabel: "삭제"});
  };

  return UIGridHelper;
}]);
