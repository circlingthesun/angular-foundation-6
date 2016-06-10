angular.module('mm.foundation.dropdownMenu', [])
.directive('dropdownMenu', ($compile) => {
    'ngInject';
    return {
        bindToController: {
            disableHover: '=',
            disableClickOpen: '=',
            closingTime: '='
        },
        scope: {},
        restrict: 'A',
        controllerAs: 'vm',
        controller: function($scope, $element) {
            'ngInject';
            var vm = this;
        }
    };
})
.directive('li', ($timeout) => {
    'ngInject';
    return {
        require: '?^^dropdownMenu',
        restrict: 'E',
        link: function($scope, $element, $attrs, dropdownMenu){
            if(!dropdownMenu){
                return;
            }

            let ulChild = null;
            let children = $element[0].children;
            var mouseLeaveTimeout;


            for(let i = 0; i < children.length; i++){
                let child = angular.element(children[i]);
                if(child[0].nodeName === 'UL' && child.hasClass('menu')){
                    ulChild = child;
                }
            }

            let topLevel = $element.parent()[0].hasAttribute('dropdown-menu');
            if(!topLevel){
                $element.addClass('is-submenu-item');
            }

            if(ulChild){
                ulChild.addClass('is-dropdown-submenu menu submenu vertical');
                $element.addClass('is-dropdown-submenu-parent opens-right');

                if(topLevel){
                    ulChild.addClass('first-sub');
                }

                if(!dropdownMenu.disableHover){
                    $element.on('mouseenter', () => {

                        $timeout.cancel(mouseLeaveTimeout);
                        $element.parent().children().children().removeClass('js-dropdown-active');
                        ulChild.addClass('js-dropdown-active');
                        $element.addClass('is-active');
                    });
                }

                $element.on('click', () => {
                    ulChild.addClass('js-dropdown-active');
                    $element.addClass('is-active');
                    // $element.attr('data-is-click', 'true');
                });

                $element.on('mouseleave', () => {
                    mouseLeaveTimeout = $timeout(function(){
                        ulChild.removeClass('js-dropdown-active');
                        $element.removeClass('is-active');
                    }, dropdownMenu.closingTime ? dropdownMenu.closingTime : 500);
                });
            }
        }
    };
});