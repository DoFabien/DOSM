app.controller('GpsWaitingCtrl', function ($scope,$location,$timeout,$rootScope) {

    $scope.watch_satus_gps = $rootScope.$watch('[position.lat,position.lng,position.accuracy]', function() { // au changement de geoloc
        console.log($rootScope.position.accuracy );
        $scope.gpsIsReady();
    });

    $scope.gpsIsReady = function(){
        if($rootScope.position.accuracy < 51){
            console.log($rootScope.position.accuracy );
            $scope.watch_satus_gps(); //clear watch!
            $timeout(function () {
                $location.path( "/main" );
            }, 0);
        }

    }
    $scope.gpsIsReady();

});