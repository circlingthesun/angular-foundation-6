angular.module('mm.foundation.modal', [])

/**
 * A helper, internal data structure that acts as a map but also allows getting / removing
 * elements in the LIFO order
 */
.factory('$$stackedMap', function() {
    'ngInject';
    return {
        createNew: function() {
            var stack = [];

            return {
                add: function(key, value) {
                    stack.push({
                        key: key,
                        value: value
                    });
                },
                get: function(key) {
                    for (var i = 0; i < stack.length; i++) {
                        if (key == stack[i].key) {
                            return stack[i];
                        }
                    }
                },
                keys: function() {
                    var keys = [];
                    for (var i = 0; i < stack.length; i++) {
                        keys.push(stack[i].key);
                    }
                    return keys;
                },
                top: function() {
                    return stack[stack.length - 1];
                },
                remove: function(key) {
                    var idx = -1;
                    for (var i = 0; i < stack.length; i++) {
                        if (key == stack[i].key) {
                            idx = i;
                            break;
                        }
                    }
                    return stack.splice(idx, 1)[0];
                },
                removeTop: function() {
                    return stack.splice(stack.length - 1, 1)[0];
                },
                length: function() {
                    return stack.length;
                }
            };
        }
    };
})

/**
 * A helper directive for the $modal service. It creates a backdrop element.
 */
.directive('modalBackdrop', function($modalStack, $timeout) {
    'ngInject';
    return {
        restrict: 'EA',
        replace: true,
        templateUrl: 'template/modal/backdrop.html',
        link: function(scope) {

            scope.close = function(evt) {
                var modal = $modalStack.getTop();
                if (modal && modal.value.backdrop && modal.value.backdrop !== 'static' && (evt.target === evt.currentTarget)) {
                    evt.preventDefault();
                    evt.stopPropagation();
                    $modalStack.dismiss(modal.key, 'backdrop click');
                }
            };
        }
    };
})

.directive('modalWindow', function($modalStack, $timeout) {
    'ngInject';
    return {
        restrict: 'EA',
        scope: {
            index: '@'
        },
        replace: true,
        transclude: true,
        templateUrl: 'template/modal/window.html',
        link: function(scope, element, attrs) {
            scope.windowClass = attrs.windowClass || '';
        }
    };
})

.factory('$modalStack', function($window, $timeout, $document, $compile, $rootScope, $$stackedMap, $animate, $q) {

    var body = $document.find('body').eq(0);
    var OPENED_MODAL_CLASS = 'is-reveal-open';
    var backdropDomEl;
    var backdropScope;
    var openedWindows = $$stackedMap.createNew();
    var $modalStack = {};

    function backdropIndex() {
        var topBackdropIndex = -1;
        var opened = openedWindows.keys();
        for (var i = 0; i < opened.length; i++) {
            if (openedWindows.get(opened[i]).value.backdrop) {
                topBackdropIndex = i;
            }
        }
        return topBackdropIndex;
    }

    $rootScope.$watch(backdropIndex, function(newBackdropIndex) {
        if (backdropScope) {
            backdropScope.index = newBackdropIndex;
        }
    });

    function resizeHandler() {
        var opened = openedWindows.keys();
        var fixedPositiong = true;
        for (var i = 0; i < opened.length; i++) {
            var modalPos = $modalStack.reposition(opened[i]);
            if(modalPos && modalPos.position !== 'fixed'){
                fixedPositiong = false;
            }
        }
        if(fixedPositiong){
            body.addClass(OPENED_MODAL_CLASS);
        } else {
            body.removeClass(OPENED_MODAL_CLASS);
        }
    }

    function removeModalWindow(modalInstance) {
        var body = $document.find('body').eq(0);
        var modalWindow = openedWindows.get(modalInstance).value;

        // clean up the stack
        openedWindows.remove(modalInstance);

        // remove window DOM element
        $animate.leave(modalWindow.modalDomEl);
        checkRemoveBackdrop();
        if (openedWindows.length() === 0) {
            body.removeClass(OPENED_MODAL_CLASS);
            angular.element($window).unbind('resize', resizeHandler);
        }
    }

    function checkRemoveBackdrop() {
        // remove backdrop if no longer needed
        if (backdropDomEl && backdropIndex() === -1) {
            var backdropScopeRef = backdropScope;

            $animate.leave(backdropDomEl).then(function() {
                backdropScopeRef.$destroy();
                backdropScopeRef = null;
            });
            backdropDomEl = undefined;
            backdropScope = undefined;
        }
    }

    function getModalCenter(modalInstance) {

        var options = modalInstance.options;
        var el = options.modalDomEl;

        var windowWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
        var windowHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

        var width = el[0].offsetWidth;
        var height = el[0].offsetHeight;

        var left = parseInt((windowWidth - width) / 2, 10);
        var top;
        if (height > windowHeight) {
            top = parseInt(Math.min(100, windowHeight / 10), 10);
        } else {
            top = parseInt((windowHeight - height) / 4, 10);
        }

        // var fitsWindow = windowHeight >= top + height; // Alwats fits on mobile
        var fitsWindow = false; // Disable annying fixed positing

        var modalPos = options.modalPos = options.modalPos || {};

        if(modalPos.windowHeight !== windowHeight){
            modalPos.scrollY = $window.pageYOffset || 0;
        }

        if(modalPos.position !== 'fixed'){
            modalPos.top = fitsWindow ? top : top + modalPos.scrollY;
        }
        modalPos.left = left;
        modalPos.position = fitsWindow ? 'fixed' : 'absolute';
        modalPos.windowHeight = windowHeight;

        return modalPos;
    }

    $document.bind('keydown', function(evt) {
        var modal;

        if (evt.which === 27) {
            modal = openedWindows.top();
            if (modal && modal.value.keyboard) {
                $rootScope.$apply(function() {
                    $modalStack.dismiss(modal.key);
                });
            }
        }
    });

    $modalStack.open = function(modalInstance, options) {
        modalInstance.options = {
            deferred: options.deferred,
            modalScope: options.scope,
            backdrop: options.backdrop,
            keyboard: options.keyboard,
        };
        openedWindows.add(modalInstance, modalInstance.options);

        var currBackdropIndex = backdropIndex();

        if (currBackdropIndex >= 0 && !backdropDomEl) {
            backdropScope = $rootScope.$new(true);
            backdropScope.index = currBackdropIndex;
            backdropDomEl = $compile('<div modal-backdrop></div>')(backdropScope);
        }

        if (openedWindows.length() === 1) {
            angular.element($window).bind('resize', resizeHandler);
        }

        var classes = [];
        options.windowClass &&  classes.push(options.windowClass);
        options.size && classes.push(options.size);

        var modalDomEl = angular.element('<div modal-window></div>').attr({
            'style': 'visibility: visible; z-index: -1; display: block;',
            'window-class': classes.join(' '),
            'index': openedWindows.length() - 1
        });
        modalDomEl.html(options.content);
        $compile(modalDomEl)(options.scope);

        return $timeout(function() {
            // let the directives kick in
            options.scope.$apply();

            openedWindows.top().value.modalDomEl = modalDomEl;

            // Attach, measure, remove
            body.prepend(modalDomEl);
            var modalPos = getModalCenter(modalInstance, true);
            modalDomEl.detach();

            modalDomEl.attr({
                'style': `visibility: visible; top: ${modalPos.top}px; left: ${modalPos.left}px; display: block; position: ${modalPos.position};`,
            });

            var promises = [];

            if(backdropDomEl){
                promises.push($animate.enter(backdropDomEl, body));
            }
            promises.push($animate.enter(modalDomEl, body));
            if(modalPos.position === 'fixed'){
                body.addClass(OPENED_MODAL_CLASS);
            }

            return $q.all(promises).then(function(){
                // VERY BAD: This moves the modal
                // // If the modal contains any autofocus elements refocus onto the first one
                // if (modalDomEl[0].querySelectorAll('[autofocus]').length > 0) {
                //     modalDomEl[0].querySelectorAll('[autofocus]')[0].focus();
                // } else {
                //     // otherwise focus the freshly-opened modal
                //     modalDomEl[0].focus();
                // }
            });
        });

    };

    $modalStack.reposition = function(modalInstance) {
        var modalWindow = openedWindows.get(modalInstance).value;
        if (modalWindow) {
            var modalDomEl = modalWindow.modalDomEl;
            var modalPos = getModalCenter(modalInstance);
            modalDomEl.css('top', modalPos.top + 'px');
            modalDomEl.css('left', modalPos.left + 'px');
            modalDomEl.css('position', modalPos.position);
            return modalPos;
        }
    };

    $modalStack.close = function(modalInstance, result) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
            modalWindow.value.deferred.resolve(result);
            removeModalWindow(modalInstance);
        }
    };

    $modalStack.dismiss = function(modalInstance, reason) {
        var modalWindow = openedWindows.get(modalInstance);
        if (modalWindow) {
            modalWindow.value.deferred.reject(reason);
            removeModalWindow(modalInstance);
        }
    };

    $modalStack.dismissAll = function(reason) {
        var topModal = this.getTop();
        while (topModal) {
            this.dismiss(topModal.key, reason);
            topModal = this.getTop();
        }
    };

    $modalStack.getTop = function() {
        return openedWindows.top();
    };

    return $modalStack;
})

.provider('$modal', function() {
    'ngInject';
    var $modalProvider = {
        options: {
            backdrop: true, //can be also false or 'static'
            keyboard: true
        },
        $get: function($injector, $rootScope, $q, $http, $templateCache, $controller, $modalStack) {
            'ngInject';

            var $modal = {};

            function getTemplatePromise(options) {
                if(options.template){
                    return $q.when(options.template);
                }
                return $http.get(options.templateUrl, {
                    cache: $templateCache
                }).then(function(result) {
                    return result.data;
                });
            }

            function getResolvePromises(resolves) {
                var promisesArr = [];
                angular.forEach(resolves, function(value, key) {
                    if (angular.isFunction(value) || angular.isArray(value)) {
                        promisesArr.push($q.when($injector.invoke(value)));
                    }
                });
                return promisesArr;
            }

            $modal.open = function(modalOpts) {

                var modalResultDeferred = $q.defer();
                var modalOpenedDeferred = $q.defer();

                // prepare an instance of a modal to be injected into controllers and returned to a caller
                var modalInstance = {
                    result: modalResultDeferred.promise,
                    opened: modalOpenedDeferred.promise,
                    close: function(result) {
                        $modalStack.close(modalInstance, result);
                    },
                    dismiss: function(reason) {
                        $modalStack.dismiss(modalInstance, reason);
                    },
                    reposition: function() {
                        $modalStack.reposition(modalInstance);
                    }
                };

                // merge and clean up options
                var modalOptions = angular.extend({}, $modalProvider.options, modalOpts);
                modalOptions.resolve = modalOptions.resolve || {};

                // verify options
                if (!modalOptions.template && !modalOptions.templateUrl) {
                    throw new Error('One of template or templateUrl options is required.');
                }

                var templateAndResolvePromise =
                    $q.all([getTemplatePromise(modalOptions)].concat(getResolvePromises(modalOptions.resolve)));


                var openedPromise = templateAndResolvePromise.then(function resolveSuccess(tplAndVars) {
                    var modalScope = (modalOptions.scope || $rootScope).$new();
                    modalScope.$close = modalInstance.close;
                    modalScope.$dismiss = modalInstance.dismiss;

                    var ctrlInstance;
                    var ctrlLocals = {};
                    var resolveIter = 1;

                    // controllers
                    if (modalOptions.controller) {
                        ctrlLocals.$scope = modalScope;
                        ctrlLocals.$modalInstance = modalInstance;
                        angular.forEach(modalOptions.resolve, function(value, key) {
                            ctrlLocals[key] = tplAndVars[resolveIter++];
                        });

                        ctrlInstance = $controller(modalOptions.controller, ctrlLocals);
                        if (modalOptions.controllerAs) {
                            modalScope[modalOptions.controllerAs] = ctrlInstance;
                        }
                    }

                    return $modalStack.open(modalInstance, {
                        scope: modalScope,
                        deferred: modalResultDeferred,
                        content: tplAndVars[0],
                        backdrop: modalOptions.backdrop,
                        keyboard: modalOptions.keyboard,
                        windowClass: modalOptions.windowClass,
                        size: modalOptions.size
                    });

                }, function resolveError(reason) {
                    modalResultDeferred.reject(reason);
                });

                openedPromise.then(function() {
                    modalOpenedDeferred.resolve(true);
                }, function() {
                    modalOpenedDeferred.reject(false);
                });

                return modalInstance;
            };

            return $modal;
        }
    };

    return $modalProvider;
});
