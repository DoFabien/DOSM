//CONTROLEUR MODAL FICHE OSM
app.controller('ModalFicheCtrl', function ($scope, $mdDialog,items,$filter,OsmFctry,ConfigFctry) {
    $scope.flex_col_read = {'A':50, 'B':50, 'C':0}; 
    $scope.flex_col_edit = {'A':45, 'B':45, 'C':10}; 

    $scope.type_action = items.type_action; // W create/ R consult
    $scope.sw_delete = false; // variable si true, le bouton supprimer apparait
    $scope.tag_hidden = ['source','name'];
    $scope.subtags = ConfigFctry.getSubTags(); // TOUS les subtags
    $scope.newKV = {k_add: '', v_add:''} ; //emplacement temporaire pour ajouter un tag
    $scope.customValueType = false; // Si les tags ne suffisent pas , permet une edition manuelle (de la clé principale seulement)
    $scope.editable= (($scope.type_action == 'W') ? true : false); // en mode edition ou non


    $scope.geojson = items.geojson; // l'object json dans son ensemble

    $scope.all_tags = ConfigFctry.getTags(); // tous les tags et leurs Configurations
    $scope.all_sub_tags = ConfigFctry.getSubTags();

    $scope.primary_tag = ConfigFctry.getPrimaryKeyOfObject($scope.geojson.properties.tags);/*Le type de la key de l'objet OSM ex: {k: "amenity", v: "restaurant"}  paramètre : les tags du geojson*/

    //console.log($scope.subtags['cuisine'].tags);
    //  $scope.types_tags = Config.getConfigTypeTag();
    /*Liste d'object des Configuration possible pour cette Primary Key*/
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
$scope.activateCustomTag = function(){
    console.log($scope.customValueType);
    $scope.customValueType = ($scope.customValueType) ? false : true;

}

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

    $scope.test = function(){
        return('dada');   
    }

    $scope.findSubTagLabel = function (_k,_v){
        //        console.log($scope.all_sub_tags[_k].tags);
        //            console.log(_k);
             //  console.log($scope.all_sub_tags[_k].tags.length);
        if($scope.all_sub_tags[_k]){
            for(var i = 0; i< $scope.all_sub_tags[_k].tags.length;i++){
            //    console.log($scope.all_sub_tags[_k].tags.v);
                if($scope.all_sub_tags[_k].tags[i].v == _v){
                    console.log( $scope.all_sub_tags[_k].tags[i].lbl);
                    return $scope.all_sub_tags[_k].tags[i].lbl;
                }
            }
        }

        else {
            return _v ;  
        }


        return _v;

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
            alert('Un nouveau tag a été saisi mais non ajouté. Supprimer son contenu ou ajouter le');
        }
        else{
            //$modalInstance.close({geojson:geojson, type_ope:$scope.type_action});
            $mdDialog.hide({geojson:geojson, type_ope:$scope.type_action});
        }

    };

    $scope.cancel = function () {
        console.log($scope.type_action);
        $mdDialog.cancel({isEditable:$scope.editable, type_ope:$scope.type_action, geojson:$scope.geojson});
        // $modalInstance.dismiss($scope.editable);
    };

    // ajouter un type D pour delete. Dans la fiche, une case a cocher => suppression, puis boutton supprimer . 
    $scope.deleteElement = function(geojson){
         $mdDialog.hide({geojson:geojson, type_ope:'D'});

        //$modalInstance.close({geojson:geojson, type_ope:'D'});
        //console.log($modalInstance);
    };

    /*onBackbutton => ferme la fiche*/
    document.addEventListener("backbutton", function(e){
         $mdDialog.cancel({isEditable:$scope.editable, type_ope:$scope.type_action, geojson:$scope.geojson});
        //$modalInstance.dismiss($scope.editable);
    }, false);
});
//EOF CTRL MODAL
