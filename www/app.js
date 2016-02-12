
var app = angular.module('myApp', ['ngRoute','ngCordova','ngMaterial','ngAnimate']);

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
        .when('/setting', {templateUrl: 'partial/Setting.html',
                           controller:'SettingCtrl'
                          })
});


app.config(function($mdThemingProvider) {
  $mdThemingProvider.theme('default')
    .primaryPalette('indigo')
    .accentPalette('blue-grey');
});

// ROOTSCOPE

app.run(function($rootScope,ConfigFctry,$cordovaGeolocation,$cordovaDeviceOrientation,$window){
    var isCordovaApp = !!window.cordova;
    if ( !isCordovaApp ) { //www in explorer for debugging
        $rootScope.position ={lat : 45.186669070708895, lng : 5.716972477664117, accuracy : 40, compass : 45};
    }
    else{
        $rootScope.position ={lat : 0, lng : 0, accuracy : Number.POSITIVE_INFINITY, compass : 0};
    }

    ConfigFctry.getTags(); // load tags in ConfigFctry.Tags
    ConfigFctry.getSubTags(); // load Subtags in ConfigFctry.SubTags






    //ON READY
    document.addEventListener("deviceready", function () {
        console.log('READY!');

        /*GEOLOCATION*/
        window.navigator.geolocation.watchPosition(
            function (position) {
                $rootScope.position.lat = position.coords.latitude;
                $rootScope.position.lng = position.coords.longitude;
                $rootScope.position.accuracy = position.coords.accuracy;
               
            },
            function(error){
                alert(error)
            },
            {maximumAge:3000, timeout:30000, enableHighAccuracy:true});



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



