//CONTROLER LOGIN
app.controller('SettingCtrl', function ($scope,$rootScope,$location,$timeout,ConfigFctry,OsmFctry) {

    $scope.toMain = function(){
        $timeout(function () {
            $location.path( "/main" );
        }, 0);
    }

    $scope.all_tags = ConfigFctry.Tags;  
    $scope.excludeChange = function(k,value){
        ConfigFctry.setExcludePrimaryKeys(k,value);
    }

    $scope.base_map_selected = ConfigFctry.getBaseMap();
    $scope.bases_maps = ConfigFctry.getBasesMaps();

    $scope.changeset_comment = ConfigFctry.getChangesetComment();
    
    /*Avant de quitter la page*/
    $scope.$on('$locationChangeStart', function( event ) {
        /*Le commentaire du changeset à changé*/
        if ($scope.changeset_comment.trim() != ConfigFctry.getChangesetComment()){

            ConfigFctry.setChangesetComment($scope.changeset_comment);
            OsmFctry.createOSMChangeSet(function(res){
               
            });
        }
    });

    $scope.$watch('base_map_selected', function(){
        console.log($scope.base_map_selected);
        ConfigFctry.setBaseMap($scope.base_map_selected);
    });


});

