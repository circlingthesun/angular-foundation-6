angular.module('mm.foundation.dropdownMenu', [])
.directive('dropdownMenu', ($compile) => {
    'ngInject';
    return {
        bindToController: {
            disableHover: '=',
            disableClickOpen: '='
        },
        scope: {},
        restrict: 'A',
        controllerAs: 'vm',
        controller: function($scope, $element) {
            'ngInject';
            var vm = this;
            // $element is-dropdown-submenu-parent
        }
    };
})
.directive('li', () => {
    return {
        require: '?^^dropdownMenu',
        restrict: 'E',
        link: function($scope, $element, $attrs, dropdownMenu){
            if(!dropdownMenu){
                return;
            }

            let ulChild = null;
            let children = $element[0].children;

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
                    ulChild.removeClass('js-dropdown-active');
                    $element.removeClass('is-active');
                });
            }
        }
    };
});
