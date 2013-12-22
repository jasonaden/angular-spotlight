
//noinspection JSCheckFunctionSignatures
(function (ng, undefined) {

    'use strict';

    var mod = angular.module('angularSpotlightDemo', ['ng', 'jasonaden.angular-spotlight']);

    mod.controller('AppCtrl', function ($scope) {

        var model = {items: [
            {title: 'First set', icon: 'first.png', displayProperty: 'text', items: [
                {id: 1, text: 'First item'},
                {id: 2, text: 'Second item'},
                {id: 3, text: 'Third item', icon: 'first-custom.png'}
            ]},
            {title: 'Second set', icon: 'second.png', displayProperty: 'text', items: [
                {id: 1, text: '1st item'},
                {id: 2, text: '2nd item'},
                {id: 3, text: '3rd item'}
            ]}
        ]}

        $scope.model = model;

    });

}) (angular);

