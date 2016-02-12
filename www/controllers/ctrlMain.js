app.controller('MainCtrl', function($scope,$window,$mdDialog,$location,OsmFctry,ConfigFctry,$timeout,$cordovaGeolocation, $cordovaDeviceOrientation, $interval,$rootScope) {


    $scope.alert = {show:false,content:'',style:''};
    $scope.show_btn = {bar_menu:true, btn_chargement:true, btn_center:true, refreshing_data:false,footer:false, update_validate:false, update_cancel:false, btn_menu:true};

    $scope.show_alert = false;
    $scope.menu_is_open =false;
    $scope.current_action = '';
    $scope.geojson_OSM = null; //les données chargées
    $scope.current_feature_OSM = null;

    $scope.zoom = 19;

    var map = $window.L.map('map',{zoomControl:false, minZoom: 19, maxZoom: 20});

    var Fgroup = L.featureGroup();
    var FgroupPosition =L.featureGroup();


    $scope.init = function(){
        $scope.refreshMapData();
    }
    $scope.marker_position =  L.marker(
        [$rootScope.position.lat, $rootScope.position.lng],
        {clickable:false,iconAngle: $rootScope.position.compass , 
         icon: L.icon({
             iconUrl: 'images/fleche_24.png',
             iconSize:     [24, 24],
             iconAnchor:   [12, 12]
             ,className:'css-icon'
         })
        }).addTo(FgroupPosition);

    $scope.circle_position =  L.circle([$rootScope.position.lat, $rootScope.position.lng], $rootScope.position.accuracy, {
        clickable:false,
        color: '#14107b', stroke:true, weight:2,fillColor: '#5652be', fillOpacity: 0.1
    }).addTo(FgroupPosition);

    $scope.bbox_data = L.rectangle([[0,0],[0,0]],{color: "#ff7800", weight: 3,fillOpacity: 0,clickable:false}).addTo(FgroupPosition);




    map.setView(L.latLng($rootScope.position.lat, $rootScope.position.lng), $scope.zoom, true);
    Fgroup.addTo(map );
    FgroupPosition.addTo(map);
    

    var base_map =  $.extend(true, {}, ConfigFctry.getBasesMaps()[ConfigFctry.getBaseMap()].layer); //clone
  //console.log(ConfigFctry.getChangesetComment());
   
    base_map.addTo(map)

    OsmFctry.getChangeset();
    ConfigFctry.getUserInfo();


    $scope.openCloseMenu = function(){
        $scope.menu_is_open = ($scope.menu_is_open) ? false : true;
    };

    $scope.zoomInOut = function(){
        if(map.getZoom()==19){ map.setZoom(20);}
        else{ map.setZoom(19);}  
    }

    map.on('zoomend',function(e){
        $scope.zoom = map.getZoom();
        $scope.$apply();
    });

    $scope.logout = function(){
        $timeout(function () {
            $location.path( "/" );
        }, 0);

    };


    document.addEventListener("backbutton", function(e){
        if($scope.menu_is_open == true){$scope.menu_is_open = false; }
    }, false);





    /*LES COORDONNEES ONT CHANGE*/
    $rootScope.$watch('[position.lat,position.lng,position.accuracy]', function() { // au changement de geoloc
        $scope.circle_position.setRadius($rootScope.position.accuracy);
        $scope.circle_position.setLatLng([$rootScope.position.lat, $rootScope.position.lng]);
        $scope.marker_position.setLatLng([$rootScope.position.lat, $rootScope.position.lng]);
        $scope.marker_position.setIconAngle($rootScope.position.compass);
        $scope.marker_position.update();
    });

    /*L'ORIENTATION A CHANGE*/
    $rootScope.$watch('position.compass', function(){
        $scope.marker_position.setIconAngle($rootScope.position.compass);
        $scope.marker_position.update()
    });


    /*CENTRE LA CARTE SUR LA POSTITION GPS*/	
    $scope.centerMapOnLocation = function(){
        if($rootScope.position.lat != 0){
            map.setView([$rootScope.position.lat,$rootScope.position.lng]);
        }
    };

    /*ON LONG TOUCH ON THE MAP*/
    map.on("contextmenu", function(e){
        console.log('ok');
        var lat =e.latlng.lat;
        var lng = e.latlng.lng;
        if($scope.current_action != 'Drag'){
            $scope.addNode(lat,lng);
        }
    });

    /*AJOUT D'UN POI OSM*/
    $scope.addNode = function(lat,lng){
        var geojson = {"type":"Feature","id":"","properties":{"type":"node","id":"","tags":{name:''},"relations":[],"meta":{"timestamp":"","version":"","changeset":"","user":"","uid":""}},"geometry":{"type":"Point","coordinates":[lng,lat]}};
        for (var k in ConfigFctry.Tags){
            console.log(k);
            var key_default = null;
            if (ConfigFctry.Tags[k].display){
                key_default = k;

                break;
            }
        }
        if (key_default){
            geojson.properties.tags[key_default]= '*';
            $scope.open($scope.$event,geojson,'W');
        }
        else{
            alert('Oh, il faut au moins un type à afficher!')
        }

    };


    $scope.alert = {show:false,content:'',style:''};
    $scope.showAlert = function(show,content,style){
        $scope.alert = {show:show,content:content,style:style};
        $scope.$apply();
    };


    $scope.dragMarker = function(marker){

        if(!$scope.$$phase) {$scope.$apply();}

        if (marker.json.properties.type == 'way'){
            $scope.showAlert(true,"Impossible de déplacer l'élément car c'est un polygone",'alert-warning');
        }
        else {

            $scope.show_btn = {bar_menu:false, btn_chargement:false,footer:true, update_validate:true, update_cancel:true};
            if(!$scope.$$phase) {$scope.$apply();}

            Fgroup.clearLayers(); 
            $scope.original_feature_OSM = jQuery.extend(true, {}, marker.json);

            marker.off("click");

            $scope.current_action = 'Drag';

            marker.on('click',function(e){
                this.stopBouncing(); 
                marker.off("click");
               // marker.dragging.enable();

            });
            marker.addTo(Fgroup);
            marker.bounce();
            marker.dragging.enable();

               marker.on('dragstart',function(e){
                this.stopBouncing(); 
                marker.off("click");
                marker.off("dragstart");
                
               // marker.dragging.enable();

            });

            marker.on('dragend',function(e){
                e.target.json.geometry.coordinates[0] = e.target.getLatLng().lng;
                e.target.json.geometry.coordinates[1] = e.target.getLatLng().lat;
            });

        }
    };

    $scope.updateOsmLatLng = function (){
        if (Fgroup.getLayers().length == 1){

            var geojson = Fgroup.getLayers()[0].json;

            OsmFctry.UpdateOsm(geojson,function(data){
                var new_version = data;
                if (data != geojson.properties.meta.version *1 + 1){
                    alert('Erreur! Une autre version existe')
                }
                $scope.show_btn = {bar_menu:true, btn_chargement:true, btn_center:true, refreshing_data:false,footer:false, update_validate:false, update_cancel:false, btn_menu:true};
                $scope.$apply();

                OsmFctry.getOsmElemById(geojson.id,function(_data){
                    $scope.geojson_OSM = $scope.refreshFeatureJson( 'R' ,$scope.geojson_OSM,_data.osmGeojson);
                    $scope.drawMarker($scope.geojson_OSM );
                });
            });
        }
    }

    $scope.cancelOsmLatLng = function (){
        $scope.show_btn = {bar_menu:true, btn_chargement:true,footer:false,refreshing_data:true, update_validate:false, update_cancel:false,btn_menu:true, btn_center:true};
        $scope.geojson_OSM = $scope.refreshFeatureJson('R',$scope.geojson_OSM,$scope.original_feature_OSM);
        $scope.drawMarker($scope.geojson_OSM );       
    }

    $scope.drawMarker = function (data){
        $scope.show_btn.refreshing_data =false,

            Fgroup.clearLayers();
        for (var i = 0; i<data.length; i++){
            var lat = data[i].geometry.coordinates[1];
            var lng = data[i].geometry.coordinates[0];
            var kv = ConfigFctry.getPrimaryKeyOfObject(data[i].properties.tags);

            var type_key = kv.k;
            var type_value =kv.v;

            var style_tag = ConfigFctry.getConfigTag(type_key,type_value);

            var marker_style = L.AwesomeMarkers.icon({icon: '',iconColor:'', markerColor: 'black', prefix: '' }); // valeur par defaut
            if (style_tag != null){ //=> on l'a pas trouvé
                marker_style = L.AwesomeMarkers.icon({icon: style_tag.icon,iconColor:style_tag.iconColor, markerColor: style_tag.markerColor, prefix: style_tag.prefix });
            }
            var marker = L.marker([lat,lng],{icon:marker_style,draggable:false});
            marker.setBouncingOptions({exclusive : true,bounceSpeed:35});

            var id_osm =  data[i].id;
            marker.id_osm = id_osm;
            marker.json = data[i];

            marker.on("click",function(e){
                this.bounce(1);
                if (e.target.json.properties.type == 'way'){
                    //c'est un polygon, on convertit le XML de façon différente pour conserver ses noeud
                    OsmFctry.getOsmElemById(e.target.json.id,function(data){
                        $timeout(function() {
                            $scope.open($scope.$event,data.osmGeojson,'R');
                        }, 100);
                    });
                }
                else{
                    $timeout(function() { // pause pour laisser l'annimation se terminer
                        $scope.open($scope.$event,e.target.json,'R');
                    }, 100);

                }
            });

            marker.on("contextmenu", function(e){ //dblclick?
                $scope.dragMarker(e.target);
            });

            marker.addTo(Fgroup);

        }
    };


    $scope.refreshMapData = function(){
        $scope.current_action = '';
        $scope.show_btn = {bar_menu:true, btn_chargement:true,footer:false,refreshing_data:true, update_validate:false, update_cancel:false,btn_menu:true, btn_center:true};
        if(!$scope.$$phase) {$scope.$apply();}
        OsmFctry.getGeojsonByBbox(ConfigFctry.getListOfPrimaryKey(),map.getBounds(),function (data){ 
            $scope.show_btn.refreshing_data = false;
            if(!$scope.$$phase) {$scope.$apply();}
            //rectangle de l'emprise des données téléchargés
            $scope.bbox_data.setBounds(map.getBounds());
            $scope.bbox_data.redraw();

            $scope.geojson_OSM = data;
            $scope.drawMarker($scope.geojson_OSM);

        });
    };


    /*Remplace la feature du json par la nouvelle*/
    $scope.refreshFeatureJson = function (_type_action,OSM_json, new_feature){
        /*CREATION*/
        if (_type_action == 'W'){ // c'est une création d'un nouveau noeud, on le push dans le json
            OSM_json.push(new_feature);
        }
        /*UPDATE*/
        else if (_type_action == 'R'){

            for (var i = 0; i < OSM_json.length; i++){
                if(OSM_json[i].id == new_feature.id){
                    if(new_feature.properties.type == 'way'){ // si c'est un plolygon, on récupère l'ancienne géométrie
                        new_feature.geometry.coordinates = OSM_json[i].geometry.coordinates;
                    }
                    OSM_json.splice(i,1,new_feature);//,new_feature
                    break;
                }
            }         
        }
        /*DELETE*/
        else if (_type_action == 'D'){
            for (var i = 0; i < OSM_json.length; i++){
                if(OSM_json[i].id == new_feature.id){
                    OSM_json.splice(i,1);
                    break;
                }
            }     
        }
        return OSM_json;
    };


    /*OUVERTURE DE LA POPIN MODAL*/
    $scope.open = function (ev,geojson,_type_action) {

        var time_start = new Date().getTime();

        $scope.original_feature_OSM = jQuery.extend(true, {}, geojson);
        //        if ($scope.modalIsOpen) return; // si déjà ouvert, on fait rien

        var items = {geojson:geojson, type_action:_type_action};
        var modalInstance = $mdDialog.show({
            templateUrl: 'partial/Modal_FicheOsm.html',//'partial/Modal_FicheOsm.html',
            controller: 'ModalFicheCtrl as ModalFicheCtrl',
            onComplete : function(){
               // console.log(new Date().getTime() - time_start );    //durée de l'ouverture de la popup   
            },
            // backdrop: false,
            locals: {
                items: items
            }
        });


        //lors du clic su OK. feature en geojson
        modalInstance.then(function (result) {

            feature = result.geojson;

            $scope.type_ope = result.type_ope;
            var RegIsInteger = /^\d+$/;
            /*CREATION*/
            if ( $scope.type_ope  == 'W'){
                OsmFctry.crateOsmNode(feature,function(data){
                    if( RegIsInteger.test(data)){ //OK
                        feature.properties.id = data;
                        feature.id = 'node/'+data;
                        feature.properties.meta.version = 1; //on ajoute la version
                        feature.properties.meta.timestamp = new Date().toISOString(); // on ajoute la date
                        feature.properties.meta.user = ConfigFctry.getUserInfo().display_name; // on ajoute l'user
                        feature.properties.meta.uid = ConfigFctry.getUserInfo().uid; // on ajoute l'uid
                        feature.properties.meta.changeset = OsmFctry.getChangeset().id; // on update le changeset
                        $scope.geojson_OSM = $scope.refreshFeatureJson( $scope.type_ope ,$scope.geojson_OSM,feature); // on rafraichit le geojson
                        $scope.drawMarker($scope.geojson_OSM );
                    }
                    else{
                        $scope.showAlert(true,"<strong>Une erreur est survenue lors de l'ajout de ce point</strong>" + data,'alert-danger');
                    }

                });

            }

            /*DELETE*/
            else if( $scope.type_ope  == 'D'){ // C'est un delete, on l'enleve de nos données, on redessine les markers
                OsmFctry.deleteOsmElem(feature,function(_data){
                    if( RegIsInteger.test(_data)){ // DELETE OK
                        $scope.geojson_OSM = $scope.refreshFeatureJson('D',$scope.geojson_OSM,feature);
                        $scope.drawMarker($scope.geojson_OSM );
                    }
                    else{ // DELETE KO
                        $scope.showAlert(true,"<strong>Une erreur est survenue lors de la suppression de ce point</strong>" + _data,'alert-danger');
                    }
                });
            }

            //UPDATE
            else {
                OsmFctry.UpdateOsm(feature,function(data){
                    var old_version = feature.properties.meta.version;
                    var new_version = data;
                    if ( 1 * old_version +1 == 1* new_version ){ // UPDATE OK
                        feature.properties.meta.version = new_version; //on update la version
                        feature.properties.meta.timestamp = new Date().toISOString(); // on update la date
                        feature.properties.meta.user = ConfigFctry.getUserInfo().display_name; // on ajoute l'user
                        feature.properties.meta.uid = ConfigFctry.getUserInfo().uid; // on ajoute l'uid
                        feature.properties.meta.changeset = OsmFctry.getChangeset().id; // on update le changeset
                        $scope.geojson_OSM = $scope.refreshFeatureJson( $scope.type_ope ,$scope.geojson_OSM,feature); // on rafraichi le geojson
                    }
                    else{ //UPDATE KO
                        $scope.showAlert(true,"<strong>Une erreur est survenue pour la mise a jour de ce point </strong>" + data,'alert-danger'); 
                    }

                });

            }

        }, function (object) { //on annule

            var feature = object.geojson;
            var type_ope = object.type_ope;
            var isEditable = object.isEditable;
            if(isEditable == true){

                if ( type_ope  == 'R'){  // c'est un update qui est annulé, on réinsert la feature originale
                    $scope.geojson_OSM = $scope.refreshFeatureJson('R',$scope.geojson_OSM,$scope.original_feature_OSM);
                    $scope.drawMarker($scope.geojson_OSM );
                }
            }

            else{
                //                console.log("c'est seulement en lecture, on ferme sans rien faire");
            }

        });


    };

    $scope.exit = function(){
        navigator.app.exitApp();   
    }

    $scope.toSetting = function(){
        $timeout(function () {
            $location.path( "/setting" );
        }, 0);
    }

    $scope.init();

});//EOF CTRL


