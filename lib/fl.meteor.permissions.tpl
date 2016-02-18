<div layout="row" layout-align="start center">
  <h3>{{vm.gridTitle}}</h3>
  <span>총 {{vm.totalCount || 0}} 개</span>
  <span flex=""></span>
  <md-button ng-click="vm.removeSelected($event)" ng-show="vm.removeSelected">삭제</md-button>
</div>

</div>
<form ng-submit="vm.savePermission()" layout="row" layout-align="start start">
  <md-input-container>
    <label>state name</label>
    <input ng-model="vm.form.name">
  </md-input-container>
  <md-input-container>
    <label>mode</label>
    <md-select ng-model="vm.form.mode">
      <md-option value="login">login</md-option>
      <md-option value="public">public</md-option>
    </md-select>
  </md-input-container>
  <md-chips ng-model="vm.form.roles" placeholder="roles" secondary-placeholder="+Role"></md-chips>
  <md-input-container>
    <label>replace state name</label>
    <input ng-model="vm.form.replaceStateName">
  </md-input-container>
  <div>
    <md-button type="submit">저장</md-button>
  </div>
</form>
<div ui-grid="vm.gridOptions" ui-grid-infinite-scroll ui-grid-selection ui-grid-resize-columns flex></div>

<script type="text/ng-template" id="common-grid/remove-btn">
  <div class="ui-grid-cell-contents" title="삭제">
    <button ng-click="grid.appScope.vm.remove(row.entity, $event)">삭제</button>
  </div>
</script>