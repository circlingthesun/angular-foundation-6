angular.module('mm.foundation.buttons', [])

.constant('buttonConfig', {
    activeClass: 'hollow',
    toggleEvent: 'click'
})

.controller('ButtonsController', ['buttonConfig', function(buttonConfig) {
    this.activeClass = buttonConfig.activeClass;
    this.toggleEvent = buttonConfig.toggleEvent;
}])

.directive('btnRadio', function() {
    'ngInject';
    return {
        require: ['btnRadio', 'ngModel'],
        controller: 'ButtonsController',
        link: function(scope, element, attrs, ctrls) {
            var buttonsCtrl = ctrls[0],
                ngModelCtrl = ctrls[1];

            //model -> UI
            ngModelCtrl.$render = function() {
                element.toggleClass(buttonsCtrl.activeClass, !angular.equals(ngModelCtrl.$modelValue, scope.$eval(attrs.btnRadio)));
            };

            //ui->model
            element.bind(buttonsCtrl.toggleEvent, function() {
                if (element.hasClass(buttonsCtrl.activeClass)) {
                    scope.$apply(function() {
                        ngModelCtrl.$setViewValue(scope.$eval(attrs.btnRadio));
                        ngModelCtrl.$render();
                    });
                }
            });
        }
    };
})

.directive('btnCheckbox', function() {
    'ngInject';
    return {
        require: ['btnCheckbox', 'ngModel'],
        controller: 'ButtonsController',
        link: function(scope, element, attrs, ctrls) {
            var buttonsCtrl = ctrls[0],
                ngModelCtrl = ctrls[1];

            function getTrueValue() {
                return getCheckboxValue(attrs.btnCheckboxTrue, true);
            }

            function getFalseValue() {
                return getCheckboxValue(attrs.btnCheckboxFalse, false);
            }

            function getCheckboxValue(attributeValue, defaultValue) {
                var val = scope.$eval(attributeValue);
                return angular.isDefined(val) ? val : defaultValue;
            }

            //model -> UI
            ngModelCtrl.$render = function() {
                element.toggleClass(buttonsCtrl.activeClass, angular.equals(ngModelCtrl.$modelValue, getFalseValue()));
            };

            //ui->model
            element.bind(buttonsCtrl.toggleEvent, function() {
                scope.$apply(function() {
                    ngModelCtrl.$setViewValue(element.hasClass(buttonsCtrl.activeClass) ? getTrueValue() : getFalseValue());
                    ngModelCtrl.$render();
                });
            });
        }
    };
});
