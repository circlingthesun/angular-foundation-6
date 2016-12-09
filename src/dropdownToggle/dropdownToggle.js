function DropdownToggleController($scope, $attrs, mediaQueries, $element, $position, $timeout, $transclude, dropdownPaneOffset) {
    'ngInject';
    const $ctrl = this;
    let hoverTimeout;
    const $body = angular.element(document.querySelector('body'));
    $ctrl.css = {};

    $transclude((clone, tScope) => {
        tScope.$close = close;
        $element.find('div').append(clone);
    }, $element.parent(), 'pane');

    $transclude((clone, tScope) => {
        $element.find('span:first').append(clone);
    }, $element.parent(), 'toggle');

    $timeout(() => {
        positionPane();
    });

    function close(e) {
        $ctrl.active = false;

        if ($ctrl.closeOnClick) {
            $body.off('click', closeOnClick);
        }
    }

    function open(e) {
        $ctrl.active = true;

        positionPane(dropdownPaneOffset);

        if ($ctrl.closeOnClick) {
            $body.on('click', closeOnClick);
        }
    }

    function closeOnClick(e) {
        const elementContents = Array.prototype.slice.apply($element[0].querySelectorAll('*'));

        if (!elementContents.length) {
            return;
        }

        const isOuterElement = elementContents.every((node) => node !== e.target);

        if (isOuterElement) {
            close();
            $scope.$apply();
        }
    }

    $ctrl.$onDestroy = () => {
        if ($ctrl.closeOnClick) {
            $body.off('click', closeOnClick);
        }
    };


    $ctrl.toggle = () => {
        if ($ctrl.active) {
            close();
        } else {
            open();
        }
    };

    $ctrl.mouseover = () => {
        $timeout.cancel(hoverTimeout);
        $ctrl.active = true;
        positionPane(dropdownPaneOffset);
    };

    $ctrl.mouseleave = () => {
        $timeout.cancel(hoverTimeout);
        hoverTimeout = $timeout(() => {
            $scope.$apply(() => {
                $ctrl.active = false;
            });
        }, 250);
    };

    function positionPane(offset_) {
        const offset = $ctrl.paneOffset || offset_;
        const dropdownTrigger = angular.element($element[0].querySelector('toggle *:first-child'));

        // let dropdownWidth = dropdown.prop('offsetWidth');
        const triggerPosition = $position.position(dropdownTrigger);

        $ctrl.css.top = `${triggerPosition.top + triggerPosition.height + offset}px`;

        if ($ctrl.paneAlign === 'center') {
            $ctrl.css.left = `${triggerPosition.left + (triggerPosition.width / 2)}px`;
            $ctrl.css.transform = 'translateX(-50%)';
        } else if ($ctrl.paneAlign === 'right') {
            $ctrl.css.left = `${triggerPosition.left + triggerPosition.width}px`;
            $ctrl.css.transform = 'translateX(-100%)';
        } else {
            $ctrl.css.left = `${triggerPosition.left}px`;
        }
    }
}

function dropdownToggle($document, $window, $location) {
    'ngInject';
    return {
        scope: {},
        restrict: 'EA',
        bindToController: {
            closeOnClick: '=',
            paneAlign: '@',
            toggleOnHover: '=',
            paneOffset: '=',
        },
        transclude: {
            'toggle': 'toggle',
            'pane': 'pane',
        },
        templateUrl: 'template/dropdownToggle/dropdownToggle.html',
        controller: DropdownToggleController,
        controllerAs: '$ctrl',
    };
}


/*
 * dropdownToggle - Provides dropdown menu functionality
 * @restrict class or attribute
 * @example:

   <a dropdown-toggle="#dropdown-menu">My Dropdown Menu</a>
   <ul id="dropdown-menu" class="f-dropdown">
     <li ng-repeat="choice in dropChoices">
       <a ng-href="{{choice.href}}">{{choice.text}}</a>
     </li>
   </ul>
 */
angular.module('mm.foundation.dropdownToggle', ['mm.foundation.position', 'mm.foundation.mediaQueries'])
.directive('dropdownToggle', dropdownToggle)
.constant('dropdownPaneOffset', 1);
