(function() {
  angular.module('fl.meteor').controller('PermissionController', PermissionController);
  PermissionController.$inject = ['$scope', '$reactive', 'UIGridHelper', 'MeteorHelper'];
  function PermissionController($scope, $reactive, UIGridHelper, MeteorHelper) {
    var self = this;
    var size = 30;
    $reactive(self).attach($scope);
    self.gridTitle = "권한관리";
    self.limit = size;
    self.query = {};
    self.form = {
      name: null,
      mode: null,
      roles: [],
      replaceStateName: null
    };

    self.helpers({
      items: function() {
        return Meteor.permissions.find(self.getReactively("query", true));
      }
    });
    self.gridOptions = {
      columnDefs: [
        {field: 'name', displayName: '스테이트이름', cellClass: 'center'},
        {field: 'mode', displayName: '모드', cellClass: 'center'},
        {field: 'roles', displayName: '롤', cellClass: 'center'},
        {field: 'replaceStateName', displayName: '미권한시이동스테이트', cellClass: 'center'}
      ],
      data: self.items,
      onRegisterApi: function(gridApi) {
        self.gridApi = gridApi;
        UIGridHelper.applyLoadMore(self, "permissionsByQuery", "permissions-of-counter", gridApi, size, $scope);
        self.removeSelected = UIGridHelper.removeSelected(gridApi, removes);
        self.remove = UIGridHelper.remove(gridApi, removes);
      }
    };
    self.savePermission = savePermission;
    self.permissionFindAll = permissionFindAll;
    self.permissionBulkUpsert = permissionBulkUpsert;

    function removes(ids) {
      return MeteorHelper.callPromise('removePermissions', ids);
    }

    function savePermission() {
      MeteorHelper.callPromise('savePermission', self.form);
    }

    function permissionFindAll() {
      MeteorHelper.callPromise('permissionFindAll').then(function(permissions) {
        self.json = JSON.stringify(_.map(permissions, function(permission) {
          return _.pick(permission, "state", "roles");
        }));
      });
    }

    function permissionBulkUpsert() {
      MeteorHelper.callPromise('permissionBulkUpsert', JSON.parse(self.json)).then(function() {
      });
    }
  }
})();
