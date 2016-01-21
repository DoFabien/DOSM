
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
     .when('/setting', {templateUrl: 'partial/Setting.html',
                    controller:'SettingCtrl'
                   })
});

// ROOTSCOPE

app.run(function($rootScope,ConfigFctry,$cordovaGeolocation,$cordovaDeviceOrientation){
    var isCordovaApp = !!window.cordova;
    if ( !isCordovaApp ) { //www in explorer fot debugging
        $rootScope.position ={lat : 45.186669070708895, lng : 5.716972477664117, accuracy : 40, compass : 45};
    }
    else{
        $rootScope.position ={lat : 0, lng : 0, accuracy : Number.POSITIVE_INFINITY, compass : 0};
    }
    
    ConfigFctry.getTags(); // load tags in ConfigFctry.Tags
    ConfigFctry.getSubTags(); // load Subtags in ConfigFctry.SubTags
    
    /*GEOLOCATION*/
    $rootScope.watchGeolocation = function(watchOptions){
        
        $rootScope.watchGps= $cordovaGeolocation.watchPosition(watchOptions);
        $rootScope.watchGps.then(
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
    }
    
   
   
    
    //ON READY
    document.addEventListener("deviceready", function () {
         $rootScope.watchGeolocation( {frequency : 1000, timeout : 5000, enableHighAccuracy: true});
    
        console.log('READY!');
        
        
      

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



