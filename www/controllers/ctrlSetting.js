//CONTROLER LOGIN
app.controller('SettingCtrl', function ($scope,$rootScope,$location,$timeout,ConfigFctry,OsmFctry) {
    
    $scope.toMain = function(){
            $timeout(function () {
            $location.path( "/main" );
        }, 0);
    }
    
//$scope.primarykeys = ConfigFctry.getListOfPrimaryKey();
$scope.all_tags = ConfigFctry.Tags;  
    $scope.excludeChange = function(k,value){
        ConfigFctry.setExcludePrimaryKeys(k,value);
    }
});

//ConfigFctry.setBaseMap('bm_osm_fr'); //to do: add select BM