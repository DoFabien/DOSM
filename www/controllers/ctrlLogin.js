//CONTROLER LOGIN
app.controller('LoginCtrl', function ($scope,$location,$timeout,ConfigFctry,OsmFctry) {
    console.log( ConfigFctry.getServerAPI().type);   
    $scope.switch_server = ConfigFctry.getServerAPI().type == 'prod' ? true : false;

    $scope.$watch('switch_server', function() {
        $scope.server = $scope.switch_server == true ? 'prod' : 'dev'; 
        ConfigFctry.setServerAPI($scope.server);
    });

    console.log(ConfigFctry.getUserInfo());
    $scope.user = ConfigFctry.getUserInfo().user;
    $scope.password = ConfigFctry.getUserInfo().password;


    // ConfigFctry.setServerAPI('dev');
    $scope.alert = false;


    $scope.connexion = function (){

        OsmFctry.getOsmPermission($scope.user,$scope.password,function(data){
            //console.log(data);
            if(data == 400){
                $timeout(function () {
                    ConfigFctry.setUserInfo($scope.user,$scope.password);
                    $location.path( "/main" );
                }, 0);

                console.log('ok');

            }
            else{
                $timeout(function () {
                    $scope.alert = true; 
                    $scope.password = '';
                }, 0);

            }
        });
    }

});