angular.module("fl.material", ["ngMaterial", "fl.lazy"])
  .provider("Dialog", function DialogProvider() {
    var options = {};
    this.setOptions = function(newOptions) {
      newOptions = newOptions || {};
      options = angular.extend(options, newOptions);
    };

    this.$get = ['$mdDialog', '$lazyLoadHelper', function($mdDialog, $lazyLoadHelper) {
      return {
        alert: alert,
        confirm: confirm,
        show: show
      };
      function alert(message, options) {
        options = options || {};
        return $mdDialog.show($mdDialog.alert()
          .title('확인')
          .textContent(message)
          .ariaLabel(options.okLabel || '확인')
          .ok(options.okLabel || '확인')
          .targetEvent(options.$event));
      }

      function confirm(message, options) {
        options = options || {};
        return $mdDialog.show($mdDialog.confirm()
          .title('확인')
          .textContent(message)
          .ariaLabel(options.okLabel || '저장')
          .ok(options.okLabel || '저장')
          .cancel(options.cancelLabel || '취소')
          .targetEvent(options.$event));
      }

      function show(option) {
        return $mdDialog.show($lazyLoadHelper.makeBundle(option));
      }
    }];
  })
  .provider("Toast", function ToastProvider() {
    var options = {
      hideDelay: 3000,
      position: "top right"
    };
    this.setOptions = function(newOptions) {
      newOptions = newOptions || {};
      options = angular.extend(options, newOptions);
    };

    this.$get = ['$mdToast', function($mdToast) {
      return {
        toast: toast

      };

      function toast(message) {
        var preset = $mdToast.simple().textContent(message);

        if(options.position) {
          preset.position(options.position);
        }
        if(options.hideDelay) {
          preset.hideDelay(options.hideDelay);
        }
        if(options.parent) {
          preset.parent(options.parent);
        }
        return $mdToast.show(preset);
      }
    }];
  })
;