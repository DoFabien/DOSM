//CONTROLEUR MODAL FICHE OSM
app.controller('ModalFicheCtrl', function ($scope, $modalInstance,items,$filter,OsmFctry,ConfigFctry) {
    $scope.type_action = items.type_action; // W create/ R consult
    $scope.sw_delete = false; // variable si true, le bouton supprimer apparait
    $scope.tag_hidden = ['source','name'];
    $scope.subtags = ConfigFctry.getSubTags(); // TOUS les subtags
    $scope.newKV = {k_add: '', v_add:''} ; //emplacement temporaire pour ajouter un tag
    $scope.customValueType = false; // Si les tags ne suffisent pas , permet une edition manuelle (de la clé principale seulement)
    $scope.editable= (($scope.type_action == 'W') ? true : false); // en mode edition ou non


    $scope.geojson = items.geojson; // l'object json dans son ensemble

    $scope.all_tags = ConfigFctry.getTags(); // tous les tags et leurs ConfigFctryurations 

    $scope.primary_tag = ConfigFctry.getPrimaryKeyOfObject($scope.geojson.properties.tags);/*Le type de la key de l'objet OSM ex: {k: "amenity", v: "restaurant"}  paramètre : les tags du geojson*/

    //console.log($scope.subtags['cuisine'].tags);
    //  $scope.types_tags = ConfigFctry.getConfigTypeTag();
    /*Liste d'object des ConfigFctryuration possible pour cette Primary Key*/
    $scope.types_tags = ConfigFctry.getTagsByPrimaryKey($scope.primary_tag.k); 

    //Config du Tag principal (shop, amenity, etc)
    /*Object de Configuration de la Primary Key actuelle */
    $scope.current_primary_key_config = ConfigFctry.getConfigTag($scope.primary_tag.k,$scope.primary_tag.v); // ligne de Configuration du tag 
    //console.log($scope.primary_tag);
    //  console.log($scope.current_primary_key_config);

    $scope.customValueType = ((!$scope.current_primary_key_config) ? true : false); // si on trouve pas le tag, on se place en mode manuel d'office
    //$scope.customValueType = false;


    $scope.showEditable = function(){
        $scope.editable = true;
    };


    /*Au changement de la clé principal, on supprime l'ancienne*/
    var old_primary_key  = $.extend(true, {}, $scope.primary_tag); // on clone 
    $scope.onPrimaryKeyChange = function(e){
        delete $scope.geojson.properties.tags[old_primary_key.k];
        $scope.geojson.properties.tags[$scope.primary_tag.k] = '*';
        old_primary_key.k =e;
        console.log(e);
        //geojson.properties.tags[e] = '*'
    };

    $scope.$watch('geojson.properties.tags[primary_tag.k]', function() { // au changement de tag principal, on rafraichi les subkey
        $scope.primary_tag = ConfigFctry.getPrimaryKeyOfObject($scope.geojson.properties.tags);/*Le type de la key de l'objet OSM ex: {k: "amenity", v: "restaurant"}  paramètre : les tags du geojson*/
        if($scope.primary_tag.v){
            //on supprimer les clé vide
            for(key in $scope.geojson.properties.tags){
                if($scope.geojson.properties.tags[key] == ""){
                    // console.log ($scope.geojson.properties.tags[key]); 
                    delete $scope.geojson.properties.tags[key];
                }
            }
            $scope.current_primary_key_config = ConfigFctry.getConfigTag($scope.primary_tag.k,$scope.primary_tag.v); // ligne de ConfigFctryuration du tag
            $scope.list_sub_tag_of_object = ($scope.current_primary_key_config) ? $scope.current_primary_key_config.subtags : [];

            //$scope.list_sub_tag_of_object = $scope.current_primary_key_config.subtags; 
        }
    });

    /*Supprime un tag*/
    $scope.supTag =  function (e){
        delete $scope.geojson.properties.tags[e];
    };
    /*ajoute le nouveau tag*/
    $scope.addTag = function (){
        if($scope.newKV.k_add !== '' && $scope.newKV.v_add !== ''){   
            $scope.geojson.properties.tags[$scope.newKV.k_add] = $scope.newKV.v_add;  
            $scope.newKV = {k_add:'', v_add:''};
        }

    };



    $scope.findSubtag = function (_array_subtag,value){

        for (var i = 0; i< _array_subtag.length; i++){
            if (_array_subtag[i].v == value){
                return   _array_subtag[i]; 
            }
        }

        return value;

    };

    $scope.strToNumber = function (str){
        if (str ===''){
            return null;   
        }
        else{
            return Number(str);
        }
    };

    $scope.ok = function (geojson) {
        if ( $scope.newKV.k_add !=='' &&  $scope.newKV.v_add !==''){
            alert('Une nouvelle tag a été saisi mais non ajouté. Supprimer son contenu ou ajouter le');
        }
        else{
            $modalInstance.close({geojson:geojson, type_ope:$scope.type_action});
        }

    };

    $scope.cancel = function () {
        $modalInstance.dismiss($scope.editable);
    };

    // ajouter un type D pour delete. Dans la fiche, une case a cocher => suppression, puis boutton supprimer .
    $scope.deleteElement = function(geojson){

        $modalInstance.close({geojson:geojson, type_ope:'D'});
        //console.log($modalInstance);
    };
    
    /*onBackbutton*/
      document.addEventListener("backbutton", function(e){
            $modalInstance.dismiss($scope.editable);
        }, false);
});
//EOF CTRL MODAL
