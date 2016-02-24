app.controller('MainCtrl', function($scope,$window,$mdDialog,$location,OsmFctry,ConfigFctry,$timeout,$cordovaGeolocation, $cordovaDeviceOrientation, $interval,$rootScope) {


    $scope.alert = {show:false,content:'',style:''};
    $scope.show_btn = {bar_menu:true, btn_chargement:true, btn_center:true, refreshing_data:false,footer:false, update_validate:false, update_cancel:false, btn_menu:true};

    $scope.show_alert = false;
    $scope.menu_is_open =false;
    $scope.current_action = '';
    $scope.zoom = 19;

    var map = $window.L.map('map',{zoomControl:false, minZoom: 19, maxZoom: 20});
    var Fgroup = L.featureGroup();
    var FgroupWay =  L.featureGroup().addTo(map);
    var FgroupPosition =L.featureGroup();


    $scope.init = function(){
        if(!OsmFctry.getGeojsonOsm()){ // Si il n'y a pas de données.
            $scope.refreshMapData();

        }
        else{
            drawMarkers(OsmFctry.getGeojsonOsm() );
            OsmFctry.getBboxData().addTo(FgroupPosition);
            console.log(OsmFctry.getBboxData());
        }
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




    $scope.updateOsmLatLng = function (){
        if (Fgroup.getLayers().length == 1){

            var feature = Fgroup.getLayers()[0].json;
            OsmFctry.UpdateOsm(feature,function(status,data){
                var new_version = data;
                if (status != 200){
                    alert(data)
                }
                $scope.show_btn = {bar_menu:true, btn_chargement:true, btn_center:true, refreshing_data:false,footer:false, update_validate:false, update_cancel:false, btn_menu:true};
                $scope.$apply();
                drawMarkers(OsmFctry.getGeojsonOsm());

            });
        }
    }

    $scope.cancelOsmLatLng = function (){
        $scope.show_btn = {bar_menu:true, btn_chargement:true,footer:false,refreshing_data:true, update_validate:false, update_cancel:false,btn_menu:true, btn_center:true};
        OsmFctry.updateFeatureToGeojsonOsm($scope.original_feature_OSM);
        $scope.current_action = '';
        drawMarkers(OsmFctry.getGeojsonOsm() );       
    }

    var drawMarkers = function (data){
        $scope.show_btn.refreshing_data =false;
        var list_of_PK_enable = ConfigFctry.getListOfPrimaryKey();

        Fgroup.clearLayers();
        for (var i = 0; i<data.length; i++){ //parcourt les données

            var kv = ConfigFctry.getPrimaryKeyOfObject(data[i].properties.tags); //trouve la clé principal (shop, amenity, etc..)
            var type_key = kv.k;

            if(list_of_PK_enable.indexOf(type_key) != -1 ){ //Si le tag principal est activé, on le dessine sur la carte
                var lat = data[i].geometry.coordinates[1];
                var lng = data[i].geometry.coordinates[0];
                var type_value =kv.v;

                /*Si c'est un way on lui affiche un petit P (polygon) ou un petit L*/
                  var marker_number = 0;
                if (data[i].properties.type == 'way'){
                    marker_number = (data[i].properties.way_geometry.type == 'Polygon' ? 'P' : 'L');
                }
              
                var style_tag = ConfigFctry.getConfigTag(type_key,type_value);

                var marker_style = L.AwesomeMarkers.icon({icon: 'fa-question-circle',iconColor:'white', markerColor: 'black', prefix: 'fa',number: marker_number }); // valeur par defaut
                if (style_tag != null){ //=> on l'a pas trouvé
                    if(!style_tag.icon || style_tag.icon == ''){ // pas d'icon défini
                        style_tag.icon = 'fa-circle';
                        style_tag.prefix = 'fa';
                        style_tag.iconColor = 'white';
                    }
                    marker_style = L.AwesomeMarkers.icon({icon: style_tag.icon,iconColor:style_tag.iconColor, markerColor: style_tag.markerColor, prefix: style_tag.prefix,number: marker_number });
                }
                var marker = L.marker([lat,lng],{icon:marker_style,draggable:false});
                marker.setBouncingOptions({exclusive : true,bounceSpeed:35});

                var id_osm =  data[i].id;
                marker.id_osm = id_osm;
                marker.json = data[i];
                marker.on("click", markerOnClick);

                marker.on("contextmenu", markerOnContextmenu);

                marker.addTo(Fgroup);
            }
        }
    };

    var markerOnClick = function(e){
        this.bounce(1);
        FgroupWay.clearLayers();
        if (e.target.json.properties.type == 'way'){
            showWay(e.target);
        }

        $timeout(function() { // pause pour laisser l'annimation se terminer
            $scope.open($scope.$event,e.target.json,'R');
        }, 100);

    };

    var markerOnContextmenu = function(e){
        var marker = e.target;
        if (marker.json.properties.type == 'node'){
            FgroupWay.clearLayers();
            $scope.dragMarker(marker);
        }
        else if (marker.json.properties.type == 'way'){
            // $scope.showAlert(true,"Impossible de déplacer l'élément car c'est un polygone",'alert-warning');
            marker.bounce(1);
            showWay(marker);

        }
    };

    var showWay = function(marker){
        FgroupWay.clearLayers();
        var way_geometry = marker.json.properties.way_geometry.coordinates;
        if (marker.json.properties.way_geometry.type =="LineString"){
            L.polyline(way_geometry).addTo(FgroupWay);
        }
        else if (marker.json.properties.way_geometry.type =="Polygon"){
            L.multiPolygon(way_geometry).addTo(FgroupWay);
        }
    }

    $scope.dragMarker = function(marker){

        if(!$scope.$$phase) {$scope.$apply();}

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

        });

        marker.on('dragend',function(e){
            e.target.json.geometry.coordinates[0] = e.target.getLatLng().lng;
            e.target.json.geometry.coordinates[1] = e.target.getLatLng().lat;
        });
    };
    //load data & draw markers
    $scope.refreshMapData = function(){
        var current_bbox = map.getBounds();
         var current_bbox_geojson = L.rectangle(current_bbox).toGeoJSON();
        $scope.current_action = '';
        $scope.show_btn = {bar_menu:true, btn_chargement:true,footer:false,refreshing_data:true, update_validate:false, update_cancel:false,btn_menu:true, btn_center:true};
        if(!$scope.$$phase) {$scope.$apply();}
        
        OsmFctry.getGeojsonByBbox(ConfigFctry.getListOfPrimaryKey(),current_bbox,function (status,data){
            if (status == 200){
            $scope.show_btn.refreshing_data = false;
            if(!$scope.$$phase) {$scope.$apply();}
            //l'emprise des données téléchargés
            if(!OsmFctry.getBboxData()){ //aucune données de chargée, on initialise le mutlipolygon
                OsmFctry.setBboxData(L.multiPolygon([L.rectangle(current_bbox)._latlngs],{color: "#ff7800", weight: 3,fillOpacity: 0,clickable:false, invert: true}));
                OsmFctry.getBboxData().addTo(FgroupPosition);
            }

            else{//il y a déjà un MP, on le fusionne avec la bbox courante //
                var bbbox_data_geojson = OsmFctry.getBboxData().toGeoJSON();
               
                var fc = turf.featurecollection([bbbox_data_geojson,current_bbox_geojson]);
                var merged = turf.merge(fc);  
                var latlngs = turf.flip(merged).geometry.coordinates;
                OsmFctry.setBboxData( OsmFctry.getBboxData().setLatLngs(latlngs));
            }
            OsmFctry.setGeojsonOsm(data,current_bbox_geojson);
            drawMarkers(OsmFctry.getGeojsonOsm() );
            }
            else {
                 $scope.show_btn.refreshing_data = false;
                $scope.showAlert(true,"<strong>Une erreur est survenue lors de la mise à jour des données</strong>" + data,'alert-danger');
            }
        });
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
            /*CREATION*/
            if ( $scope.type_ope  == 'W'){
                OsmFctry.crateOsmNode(feature,function(status,data){
                    if( status == 200){ //OK
                        feature.properties.id = data;
                        feature.id = 'node/'+data;
                        feature.properties.meta.version = 1; //on ajoute la version
                        feature.properties.meta.timestamp = new Date().toISOString(); // on ajoute la date
                        feature.properties.meta.user = ConfigFctry.getUserInfo().display_name; // on ajoute l'user
                        feature.properties.meta.uid = ConfigFctry.getUserInfo().uid; // on ajoute l'uid
                        feature.properties.meta.changeset = OsmFctry.getChangeset().id; // on update le changeset
                        OsmFctry.addFeatureToGeojsonOsm(feature);
                        drawMarkers(OsmFctry.getGeojsonOsm() );
                    }
                    else{
                        $scope.showAlert(true,"<strong>Une erreur est survenue lors de l'ajout de ce point</strong>" + data,'alert-danger');
                    }

                });

            }

            /*DELETE*/
            else if( $scope.type_ope  == 'D'){ // C'est un delete, on l'enleve de nos données, on redessine les markers
                OsmFctry.deleteOsmElem(feature,function(_status,_data){
                    if(_status == 200){ // DELETE OK
                        OsmFctry.deleteFeatureToGeojsonOsm(feature);
                        drawMarkers(OsmFctry.getGeojsonOsm() );
                    }
                    else{ // DELETE KO
                        $scope.showAlert(true,"<strong>Une erreur est survenue lors de la suppression de ce point</strong>" + _data,'alert-danger');
                    }
                });
            }

            //UPDATE
            else {
                OsmFctry.UpdateOsm(feature,function(status,data){
                    var old_version = feature.properties.meta.version;
                    var new_version = data;
                    if ( status == 200 ){ // UPDATE OK
                        feature.properties.meta.version = new_version; //on update la version
                        feature.properties.meta.timestamp = new Date().toISOString(); // on update la date
                        feature.properties.meta.user = ConfigFctry.getUserInfo().display_name; // on ajoute l'user
                        feature.properties.meta.uid = ConfigFctry.getUserInfo().uid; // on ajoute l'uid
                        feature.properties.meta.changeset = OsmFctry.getChangeset().id; // on update le changeset
                        OsmFctry.updateFeatureToGeojsonOsm(feature);
                        drawMarkers(OsmFctry.getGeojsonOsm() );
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
                    OsmFctry.UpdateFeatureToGeojsonOsm($scope.original_feature_OSM);
                    drawMarkers(OsmFctry.getGeojsonOsm() );
                }
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


