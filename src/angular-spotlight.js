//noinspection JSCheckFunctionSignatures
(function (ng, undefined) {

    'use strict';

    function findElement(el /*element or jQuery Lite object*/, selector /*CSS selector*/) {
        if (el instanceof ng.element) {
            // Get base element
            el = el[0];
        }
        return el.querySelector(selector);
    }

    var mod = angular.module('jasonaden.angular-spotlight', ['ng']);

    mod
        .config(['$sceDelegateProvider', function ($sceDelegateProvider) {
            $sceDelegateProvider.resourceUrlWhitelist(['self', 'http://www.ng-conf.org']);
        }])
        .directive('angularSpotlight', ['$compile', '$document', '$position', '$timeout', '$parse', function ($compile, $document, $position, $timeout, $parse) {

            function getSize(element) {
                return {width: element.prop('offsetWidth'), height: element.prop('offsetHeight')};
            }

            function calculatePosition(tiedTo, popupSize) {
                var tiedToPosition = $position.position(tiedTo);
                return {
                    left: (tiedToPosition.left + tiedToPosition.width) - popupSize.width,
                    top: tiedToPosition.top + tiedToPosition.height + 1
                }
            }

            return {
                require: ['?ngModel', 'angularSpotlight'],
                controller: function () {
                    var selectedItem, activeItem;

                    ng.extend(this, {
                        setSelected: function (item) {
                            selectedItem = item;
                        },
                        getSelected: function () {
                            return selectedItem;
                        },
                        setActive: function (item) {
                            if (activeItem) activeItem.$active = false;
                            if (item) item.$active = true;
                            activeItem = item;
                        },
                        getActive: function () {
                            return activeItem;
                        }

                    });
                },
                link: function (scope, element, attrs, ctrls) {
                    var ngModel = ctrls[0], ctrl = ctrls[1],
                        popup = angular.element('<angular-spotlight-popup></angular-spotlight-popup>'),
                        fetchFn,
                        popupSize,
                        $body = $document.find('body'),
                        newScope = scope.$new(),
                        showIt = false;

                    /*** Setup the popup ***/
                    // Tie to bindings
                    popup.attr({
                        position: 'position',
                        'is-open': 'isOpen()',
                        close: 'close()',
                        'result-set': 'resultSet'
                    });
                    // Apply ngModelController to popup
                    popup.data('$ngModelController', ngModel);
                    popup.data('$angularSpotlightController', ctrl);

                    /*** Setup a new scope for the popup ***/
                    angular.extend(newScope, {
                        position: {},
                        isOpen: function () {return showIt;},
                        close: function () {showIt = false;},
                        resultSet: [] //$parse(attrs.angularSpotlight)(scope)
                    });
                    $body.append($compile(popup)(newScope));

                    // Show/hide popup on click of spotlight button
                    element.on('click', function (evt) {
                        evt.stopPropagation();
                        toggleShow(evt);
                    });

                    // Keep keyboard handler so we can turn it off
                    var keyboardHandler = function (evt) {
                        switch (evt.which) {
                            case 32:
                                if (evt.metaKey && evt.shiftKey) {
                                    toggleShow(evt);
                                    evt.preventDefault();
                                }
                                break;
                        }
                    };

                    $document.bind('keydown', keyboardHandler);

                    scope.$on('$destroy', function(){
                        $document.unbind('click', keyboardHandler);
                    });

                    /* Show and hide the popup */
                    function toggleShow (evt) {
                        // Store the size of the popup
                        if (!popupSize) {
                            popup.css({display:'block'});
                            popupSize = $position.offset(popup);
                            popup.css({display:'none'});
                        }
                        // Toggle
                        showIt = !showIt;
                        if (showIt) {
                            // Position the spotlight -- Do this each time it's opened.
                            ng.extend(newScope.position, calculatePosition(element, popupSize));
                        } else {
                            ctrl.setActive(undefined);
                        }
                        newScope.$digest();
                    }

                    /*** SEARCHING ***/
                    if (attrs.fetch) {
                        if (ng.isFunction(scope[attrs.fetch])) {
                            fetchFn = scope[attrs.fetch];
                        } else {
                            // Support for static data?
                        }
                    }
                    // Wire up to listen for changes
                    ngModel.$viewChangeListeners.push(function () {
                        fetchFn(ngModel.$viewValue).then(function (data) {
                            newScope.resultSet = data;
                        })
                    })
                }
            };

        }])
        .directive('angularSpotlightPopup', ['$document', function ($document) {
            return {
                restrict: 'E',
                replace: true,
                scope: {
                    position: '=',
                    isOpen: '&',
                    close: '&',
                    resultSet: '='
                },
                templateUrl: '../template/angular-spotlight.html',
                link: function (scope, element, attrs) {
                    console.log(scope.resultSet);
                    var ngModel = element.data('$ngModelController');
                    scope.$watch('isOpen()', function (val, oldVal) {
                        if (val && !oldVal) {
                            element.find('input')[0].focus();
                        }
                    });

                    // Don't let Click event get to document which would close the results
                    element.on('click', function (evt) {
                        element.find('input')[0].focus();
                        evt.stopPropagation();
                    });

                    // Keep reference to click handler to unbind it.
                    var dismissClickHandler = function (evt) {
                        scope.close();
                        scope.$digest();
                    };

                    $document.bind('click', dismissClickHandler);

                    scope.$on('$destroy', function(){
                        $document.unbind('click', dismissClickHandler);
                    });

                    // Wire up the input
                    element.find('input').on('input', function (evt) {
                        ngModel.$setViewValue(ng.element(evt.target).val());
                    });
                }
            }
        }])
        .directive('angularSpotlightItem', [function () {
            return {
                restrict: 'E',
                templateUrl: '../template/angular-spotlight-item.html',
                replace: true,
                scope: {
                    item: '='
                },
                require: ['^ngModel', '^angularSpotlight'],
                link: function (scope, element, attrs, ctrls) {
                    var ngModel = ctrls[0], ctrl = ctrls[1];

                    scope.setActive = ctrl.setActive;
                }
            }
        }])
        /* $position service from ui-bootstrap project */
        .factory('$position', ['$document', '$window', function ($document, $window) {

            function getStyle(el, cssprop) {
                if (el.currentStyle) { //IE
                    return el.currentStyle[cssprop];
                } else if ($window.getComputedStyle) {
                    return $window.getComputedStyle(el)[cssprop];
                }
                // finally try and get inline style
                return el.style[cssprop];
            }

            /**
             * Checks if a given element is statically positioned
             * @param element - raw DOM element
             */
            function isStaticPositioned(element) {
                return (getStyle(element, "position") || 'static' ) === 'static';
            }

            /**
             * returns the closest, non-statically positioned parentOffset of a given element
             * @param element
             */
            var parentOffsetEl = function (element) {
                var docDomEl = $document[0];
                var offsetParent = element.offsetParent || docDomEl;
                while (offsetParent && offsetParent !== docDomEl && isStaticPositioned(offsetParent) ) {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent || docDomEl;
            };

            return {
                /**
                 * Provides read-only equivalent of jQuery's position function:
                 * http://api.jquery.com/position/
                 */
                position: function (element) {
                    var elBCR = this.offset(element);
                    var offsetParentBCR = { top: 0, left: 0 };
                    var offsetParentEl = parentOffsetEl(element[0]);
                    if (offsetParentEl != $document[0]) {
                        offsetParentBCR = this.offset(angular.element(offsetParentEl));
                        offsetParentBCR.top += offsetParentEl.clientTop - offsetParentEl.scrollTop;
                        offsetParentBCR.left += offsetParentEl.clientLeft - offsetParentEl.scrollLeft;
                    }

                    var boundingClientRect = element[0].getBoundingClientRect();
                    return {
                        width: boundingClientRect.width || element.prop('offsetWidth'),
                        height: boundingClientRect.height || element.prop('offsetHeight'),
                        top: elBCR.top - offsetParentBCR.top,
                        left: elBCR.left - offsetParentBCR.left
                    };
                },

                /**
                 * Provides read-only equivalent of jQuery's offset function:
                 * http://api.jquery.com/offset/
                 */
                offset: function (element) {
                    var boundingClientRect = element[0].getBoundingClientRect();
                    return {
                        width: boundingClientRect.width || element.prop('offsetWidth'),
                        height: boundingClientRect.height || element.prop('offsetHeight'),
                        top: boundingClientRect.top + ($window.pageYOffset || $document[0].body.scrollTop || $document[0].documentElement.scrollTop),
                        left: boundingClientRect.left + ($window.pageXOffset || $document[0].body.scrollLeft  || $document[0].documentElement.scrollLeft)
                    };
                }
            };
        }]);


})(angular);
