//CONTROLER LOGIN
app.controller('SettingCtrl', function ($scope,$location,$timeout,ConfigFctry,OsmFctry) {
    
    $scope.toMain = function(){
            $timeout(function () {
            $location.path( "/main" );
        }, 0);
    }
    
});