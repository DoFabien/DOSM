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
    
    $scope.base_map_selected = ConfigFctry.getBaseMap();
    $scope.bases_maps = ConfigFctry.getBasesMaps();
console.log($scope.bases_maps);
    
    console.log(ConfigFctry.getBaseMap());
//ConfigFctry.setBaseMap('bm_osm_fr'); //to do: add select BM
    
    $scope.$watch('base_map_selected', function(){
        console.log($scope.base_map_selected);
        ConfigFctry.setBaseMap($scope.base_map_selected);
    });
});

