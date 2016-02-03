angular.module('fl.common', ['ui.router', 'fl.lazy'])
  .constant("INIT_LOADING_STATE", false)
  .directive("flAutoHeight", ['$window', '$timeout', function($window, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        function resize() {
          var offset = parseInt(attr.flAutoHeight, 10) || 0;
          element.height(angular.element(document.body).height() - element.offset().top - offset);
        }

        angular.element($window).on('resize', resize);
        scope.$on('$destroy', function() {
          angular.element($window).off('resize', resize);
        });
        $timeout(resize, 10);
      }
    }
  }])
  .directive('gridResizer', ['$window', '$timeout', function($window, $timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        function resize() {
          var offset = parseInt(attr.gridResizer, 10) || 0;
          element.height(angular.element(document.body).height() - element.offset().top - offset);
        }

        angular.element($window).on('resize', resize);
        scope.$on('$destroy', function() {
          angular.element($window).off('resize', resize);
        });
        $timeout(resize, 0);
      }
    }
  }])

  .filter('fractional', [function() {
    return function(value, fixed) {
      var removeValue = parseInt(value, 10);
      return ((value - removeValue).toFixed(fixed || 2) + "").slice(1);
    };
  }])
  .filter('parseInt', [function() {
    return parseInt;
  }])

  .directive('naLoadingComplete', [function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        if(attr.loadingComplete == 'hide') {
          element.hide();
        } else {
          element.show();
        }
      }
    }
  }])
  .directive('naStopDefault', [function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        var eventType = attr.stopDefault || 'click';
        element.bind(eventType, function(event) {
          event.preventDefault();
        });
      }
    }
  }])
  .directive('naFocus', ['$timeout', function($timeout) {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        var el = element.get(0);
        try {
          if(el && typeof el.focus == "function") {
            $timeout(function() {
              el.blur();
              $timeout(function() {
                el.focus();
              });
            });
          }
        } catch(me) {
        }
      }
    }
  }])
  .directive('naWhenActive', ['$location', function($location) {
    return {
      restrict: 'A',
      link: function(scope, element, attrs) {
        if($location.path() === attrs.naWhenActive) {
          element.addClass("active");
        } else {

          element.removeClass("active");
        }
      }
    }
  }])
  .directive('naRedirect', function($window, $location) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        if(attrs.naRedirect) {
          var currentUrl = $location.url();
          $window.location.href = attrs.naRedirect + currentUrl;
        }
      }
    };
  })
  .directive('naLinkByLocation', ['$window', function($window) {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        //  Mobile Safari in standalone mode
        if(("standalone" in $window.navigator) && $window.navigator.standalone) {
          element.click(function(event) {
            event.preventDefault();
            $window.location.href = attrs.href;
          });
        }
      }
    };
  }])
  .directive('naKeydownThanBlur', [function() {
    return {
      restrict: 'A',
      link: function(scope, element, attr) {
        element.keydown(function($event) {
          if($event.keyCode !== 13) {
            return;
          }
          $event.preventDefault();
          $event.stopPropagation();
          $event.target.blur();
        });
      }
    }
  }])
  .factory('LoadingIndicator', ['$timeout', '$rootScope', 'INIT_LOADING_STATE', function($timeout, $rootScope, INIT_LOADING_STATE) {
    var timerPromise = null;
    $rootScope.isLoading = INIT_LOADING_STATE;

    return {
      start: start,
      stop: stop,
      isLoading: isLoading
    };

    function start() {
      $timeout.cancel(timerPromise);
      $rootScope.isLoading = true;
      timerPromise = $timeout(function() {
        stop();
      }, 10000);
    }

    function stop() {
      $timeout.cancel(timerPromise);
      $rootScope.isLoading = false;
    }

    function isLoading() {
      return $rootScope.isLoading;
    }

  }])
  .filter('encodeURIComponent', [function() {
    return encodeURIComponent;
  }])
  .run(run);

run.$inject = ['$rootScope'];

function run($rootScope) {
}