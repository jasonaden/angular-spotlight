
//noinspection JSCheckFunctionSignatures
(function (ng, undefined) {

    'use strict';

    var mod = angular.module('jasonaden.angular-spotlight', ['ng']);

    mod.directive('angularSpotlight', ['$compile', function ($compile) {

        return {
            link: function (scope, element, attrs) {
                var popup = angular.element('<angular-spotlight-popup></angular-spotlight-popup>');

                popup.css({display: 'none'});

                var newScope = scope.$new();

                element.after($compile(popup)(newScope));

                // Open the element when we click it
                element.on('click', function (evt) {
                    popup.css({display: 'block'});
                })
            }
        };

    }])
        .directive('angularSpotlightPopup', [function () {
            return {
                restrict: 'E',
                templateUrl: '../template/angular-spotlight.html'
            }
        }])
        .directive('angularSpotlightMatch', [function () {
            return {
                restrict: 'E',
                templateUrl: '/template/angular-spotlight-match.html'
            }
        }]);


}) (angular);
