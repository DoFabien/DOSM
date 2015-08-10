
var app = angular.module('myApp', ['ui.bootstrap','ngRoute','ngSanitize','ngCordova']); //'ui.bootstrap'

        app.config(function($routeProvider) {
            $.material.init();
            $routeProvider
            .when('/main', {templateUrl: 'partial/main.html',
                        controller:'MainCtrl'
                       })
            .when('/', {templateUrl: 'partial/login.html',
                        controller:'LoginCtrl'
                       })
        });


        // DIRECTIVES
        app.directive('ngLowercase', function(){
            return {
                require: 'ngModel',
                link: function(scope, element, attrs, modelCtrl) {

                    modelCtrl.$parsers.push(function (inputValue) {

                        var transformedInput = inputValue.toLowerCase().replace(/ /g, ''); 

                        if (transformedInput!=inputValue) {
                            modelCtrl.$setViewValue(transformedInput);
                            modelCtrl.$render();
                        }         

                        return transformedInput;         
                    });
                }
            };
        });


   