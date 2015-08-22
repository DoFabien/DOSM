//CONTROLER LOGIN
app.controller('SettingCtrl', function ($scope,$rootScope,$location,$timeout,ConfigFctry,OsmFctry) {
    
    $scope.toMain = function(){
            $timeout(function () {
            $location.path( "/main" );
        }, 0);
    }
    
    $scope.enableHighAccuracy = ($scope.enableHighAccuracy) ? true : false;
      $scope.$watch('enableHighAccuracy', function() {
        //$scope.server = $scope.switch_server == true ? 'prod' : 'dev'; 
        //ConfigFctry.setServerAPI($scope.server);
           $rootScope.watchGps.clearWatch();
           $rootScope.watchGeolocation( {frequency : 1000, timeout : 5000, enableHighAccuracy: $scope.enableHighAccuracy});
          console.log($scope.enableHighAccuracy);
    });
    
    
});