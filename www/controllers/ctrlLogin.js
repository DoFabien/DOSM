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

    $scope.error_text ='';
    $scope.alert = false;


    $scope.connexion = function (){

        ConfigFctry.getUserDetail($scope.user,$scope.password,function(data){
            console.log(data);
            if(data == 200){
                $timeout(function () {
                
                    $location.path( "/gps" );
                }, 0);
            }
            else{
                if(data==401){
                    $scope.error_text = "Nom d'utilisateur ou mot de passe invalide";
                    $scope.password = '';
                }
                else if (data==404){
                    $scope.error_text = "Connexion impossible. Problème de réseau?";
                }
                else {
                    $scope.error_text = "Connexion impossible. Erreur :" + data;  
                }
                $scope.alert = true; 
                $scope.$apply();

            }
        });
    };

});