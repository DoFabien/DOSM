
var app = angular.module('myApp', ['ngRoute','ngCordova','ngMaterial']);

app.config(function($routeProvider) {

    $routeProvider
        .when('/main', {templateUrl: 'partial/main.html',
                        controller:'MainCtrl'
                       })
        .when('/', {templateUrl: 'partial/login.html',
                    controller:'LoginCtrl'
                   })
        .when('/gps', {templateUrl: 'partial/GpsWaiting.html',
                    controller:'GpsWaitingCtrl'
                   })
});

// ROOTSCOPE

app.run(function($rootScope,ConfigFctry,$cordovaGeolocation,$cordovaDeviceOrientation){
    $rootScope.position ={lat : 0, lng : 0, accuracy : Number.POSITIVE_INFINITY, compass : 0};
    /*DEBUG*/
    $rootScope.position.lat = 45.186669070708895;
    $rootScope.position.lng = 5.716972477664117;
    $rootScope.position.compass = 45;
    $rootScope.position.accuracy = 40;
    
    ConfigFctry.getTags(); // load tags in ConfigFctry.Tags
    ConfigFctry.getSubTags(); // load Subtags in ConfigFctry.SubTags
    //ON READY
    document.addEventListener("deviceready", function () {
        console.log('READY!');
        /*GEOLOCATION*/
        var watchOptions = {frequency : 1000, timeout : 5000, enableHighAccuracy: true};
        $rootScope.watch = $cordovaGeolocation.watchPosition(watchOptions);
        $rootScope.watch.then(
            null,
            function(err) {
                console.log(err);
            },
            function(result) {
               // ConfigFctry.setPositionLatLng(result.coords.latitude,result.coords.longitude,result.coords.accuracy)
                $rootScope.position.lat = result.coords.latitude;
                $rootScope.position.lng = result.coords.longitude;
                $rootScope.position.accuracy = result.coords.accuracy;
            }); 

        /*ORIENTATION*/
        $rootScope.watchCompass = $cordovaDeviceOrientation.watchHeading({frequency:150});
        $rootScope.watchCompass.then(
            null,
            function(error) {
                console.log(error);
            },
            function(result) {   
                $rootScope.position.compass = result.trueHeading;
            });



    }, false);




});
//EOF ROOTSCOPE


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



