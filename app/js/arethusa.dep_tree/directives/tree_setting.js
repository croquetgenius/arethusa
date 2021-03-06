"use strict";

angular.module('arethusa.depTree').directive('treeSetting', function() {
  return {
    restrict: 'A',
    scope: {
      title: '@',
      val: '=treeSetting'
    },
    link: function(scope, element, attrs) {
      scope.increment = function() {
        scope.val++;
      };
      scope.decrement = function() {
        scope.val--;
      };
    },
    templateUrl: 'js/arethusa.dep_tree/templates/tree_setting.html'
  };

});
