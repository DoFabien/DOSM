//DEBUT DU CONTROLEUR 1
app.controller('MainCtrl', function($scope,$window,$mdDialog,$location,OsmFctry,ConfigFctry,$timeout,$cordovaGeolocation, $cordovaDeviceOrientation, $interval) {

    //TEST
    //console.log(ConfigFctry.getPrimaryKeys());
    console.log(ConfigFctry.getSubTags());
    $scope.test = function(){
        if($scope.menu_is_open == true){
            $scope.menu_is_open = false;   
        }
        else{
            $scope.menu_is_open = true;
        }
        console.log($scope.menu_is_open );
        // console.log($scope.modalIsOpen);

    };
    //TEST

    $scope.alert = {show:false,content:'',style:''};
    $scope.show_btn = {bar_menu:true, btn_chargement:true, btn_center:true, refreshing_data:false,footer:false, update_validate:false, update_cancel:false, btn_menu:true};
    //OsmFctry.setChangeset(53748,0);
    $scope.position = {lat : 0, lng : 0, accuracy : 0, compass : 0};

    $scope.marker_position =  L.marker(
        [$scope.position.lat, $scope.position.lng],
        {clickable:false,renderer : L.canvas(),iconAngle: $scope.position , 
         icon: L.icon({
             iconUrl: 'images/fleche_24.png',
             iconSize:     [24, 24],
             iconAnchor:   [12, 12]
             // ,renderer : L.canvas()
         })
        });

    $scope.circle_position =  L.circle([0, 0], 1, {
        clickable:false,
        color: '#383a40',
        stroke:true,
        weight:2,
        fillColor: '#070707',
        fillOpacity: 0.1
        // ,renderer : L.canvas()
    });

    OsmFctry.getChangeset();
    ConfigFctry.getUserInfo();

    //$scope.refreshing_data = false;
    $scope.show_alert = false;
    $scope.menu_is_open =false;
    $scope.current_action = '';
    $scope.geojson_OSM = null;

    $scope.logout = function(){

        $timeout(function () {
            $location.path( "/" );
        }, 0);

    };

    var basemaps = [
        {name:'OSM fr', url:$window.L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',{maxZoom:20})}
    ];
    $scope.map = $window.L.map('map',{zoomControl:false});

    L.control.zoom({position:'topright'}).addTo($scope.map );



    var Fgroup = L.featureGroup();
    var FgroupPosition =L.featureGroup();
    $scope.marker_position.addTo(FgroupPosition);
    $scope.circle_position.addTo(FgroupPosition);
    //console.log($scope.map );
    $scope.init = function () {
        var view = {lat:45.1865,lng: 5.717,zoom: 19};
        $scope.map.setView(L.latLng(view.lat, view.lng), view.zoom, true);
        basemaps[0].url.addTo($scope.map );
        Fgroup.addTo($scope.map );
        FgroupPosition.addTo($scope.map );

    };
    $scope.init();



    //ON READY
    document.addEventListener("deviceready", function () {


        document.addEventListener("backbutton", function(e){
             if($scope.menu_is_open == true){
            $scope.menu_is_open = false;   
             }
        }, false);

        $interval(function(){
            $scope.getCompass();
        },30);

        $interval(function(){
            $scope.getPosition();
        },1000);


    }, false);

    //COMPASS
    $scope.getCompass = function(){

        $cordovaDeviceOrientation.getCurrentHeading().then(function(result) {
            $scope.position.compass = result.trueHeading;

            $scope.marker_position.setIconAngle($scope.position.compass);
            $scope.marker_position.update()



        }, function(err) {
            // An error occurred
        });   

    }

    //CORDOVA GEOLOCATION
    $scope.getPosition = function(){

        var posOptions = {/*timeout: 100000, */enableHighAccuracy: true};
        $cordovaGeolocation
            .getCurrentPosition(posOptions)
            .then(function (result) {
            $scope.position.lat = result.coords.latitude;
            $scope.position.lng = result.coords.longitude;
            $scope.position.accuracy = result.coords.accuracy;

            $scope.circle_position.setRadius($scope.position.accuracy);
            $scope.circle_position.setLatLng([$scope.position.lat, $scope.position.lng]);
            $scope.marker_position.setLatLng([$scope.position.lat, $scope.position.lng]);

            $scope.marker_position.update();


        }, function(err) {
            // error
        });

    }



    ///////	
    $scope.centerMapOnLocation = function(){
        console.log($scope.position);
        $scope.map.setView([$scope.position.lat,$scope.position.lng]);
    };

    $scope.map.on("contextmenu", function(e){
        var lat =e.latlng.lat;
        var lng = e.latlng.lng;
        if($scope.current_action != 'Drag'){
            $scope.addNode(lat,lng);
        }
    });

    $scope.addNode = function(lat,lng){

        var geojson = {"type":"Feature","id":"","properties":{"type":"node","id":"","tags":{name:'',shop:'*'},"relations":[],"meta":{"timestamp":"","version":"","changeset":"","user":"","uid":""}},"geometry":{"type":"Point","coordinates":[lng,lat]}};

        $scope.open($scope.$event,geojson,'W');
    };


    $scope.alert = {show:false,content:'',style:''};
    $scope.showAlert = function(show,content,style){
        $scope.alert = {show:show,content:content,style:style};
        $scope.$apply();

        $timeout(function () {
            $scope.alert = {show:false,content:'',style:''};
            $scope.$apply();
        }, 3000);
    };

    $scope.dragMarker = function(marker){

        if (marker.json.properties.type == 'way'){
            $scope.showAlert(true,"Impossible de déplacer l'élément car c'est un polygone",'alert-warning');
        }
        else {
            $scope.show_btn = {bar_menu:false, btn_chargement:false,footer:true, update_validate:true, update_cancel:true};
            $scope.$apply();
            Fgroup.clearLayers(); 
            // console.log(marker);
            marker.off("click");
            $scope.current_action = 'Drag';
            marker.addTo(Fgroup);
            marker.dragging.enable();

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
                var old_version = geojson.properties.meta.version;
                var new_version = data;
                if ( 1 * old_version +1 != 1* new_version ){
                    $scope.showAlert(true,"Une erreur est survenue pour la mise a jour de ce point",'alert-danger'); 
                }
                $scope.show_btn.footer= false;
                // $scope.show_btn = {bar_menu:true, btn_chargement:true,footer:false, update_validate:false, update_cancel:false};
                $scope.$apply();
                $scope.refreshMapData();
            });

        }

    }

    $scope.drawMarker = function (data){
        $scope.show_btn.refreshing_data =false,
            $scope.$apply();

        Fgroup.clearLayers();
        for (var i = 0; i<data.length; i++){
            var lat = data[i].geometry.coordinates[1];
            var lng = data[i].geometry.coordinates[0];
            var kv = ConfigFctry.getPrimaryKeyOfObject(data[i].properties.tags);

            var type_key = kv.k;
            var type_value =kv.v;


            //var style_tag = ConfigFctry.getTypeByKeyTag(type_key,type_value);
            var style_tag = ConfigFctry.getConfigTag(type_key,type_value);

            var marker_style = L.AwesomeMarkers.icon({icon: '',iconColor:'', markerColor: 'black', prefix: '' }); // valeur par defaut
            if (style_tag != null){ //=> on l'a pas trouvé
                marker_style = L.AwesomeMarkers.icon({icon: style_tag.icon,iconColor:style_tag.iconColor, markerColor: style_tag.markerColor, prefix: style_tag.prefix });
            }

            var marker = L.marker([lat,lng],{icon:marker_style,draggable:false});

            var id_osm =  data[i].id;
            marker.id_osm = id_osm;
            marker.json = data[i];
            marker.on("click",function(e){
                if (e.target.json.properties.type == 'way'){

                    //c'est un polygon, on convertit le XML de façon différente pour conserver ses noeud
                    OsmFctry.getOsmElemById(e.target.json.id,function(data){
                        $scope.open($scope.$event,data.osmGeojson,'R');  
                        console.log(data.osmGeojson);
                    });

                }

                else{
                    $scope.open($scope.$event,e.target.json,'R');
                }

            });
            marker.on("dblclick",function(e){
                //rien
            });

            marker.on("contextmenu", function(e){
                $scope.dragMarker(e.target);

            });

            marker.addTo(Fgroup);

        }
    };


    $scope.refreshMapData = function(){
        $scope.current_action = '';
        $scope.show_btn = {bar_menu:true, btn_chargement:true,footer:false,refreshing_data:true, update_validate:false, update_cancel:false,btn_menu:true, btn_center:true};
        // $scope.$apply();
        OsmFctry.getGeojsonByBbox(ConfigFctry.getListOfPrimaryKey(),$scope.map .getBounds(),function (data){
            $scope.geojson_OSM = data;
            $scope.drawMarker($scope.geojson_OSM);
        });
    };

    //  $scope.refreshMapData();

    /*    remplace la feature du json par la nouvelle  */
    $scope.refreshFeatureJson = function (_type_action,OSM_json, new_feature){

        console.log(new_feature);
        if (_type_action == 'W'){ // c'est une création d'un nouveau noeud, on le push dans la json
            OSM_json.push(new_feature);
        }

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

        else if (_type_action == 'D'){
            console.log('on a supprimé, on enleve l\'objet supprimé, et on redessine');
        }
        return OSM_json;
    };

    $scope.modalIsOpen = false; // La fenetre modal est ouverte ou non?
    $scope.$watch('modalIsOpen', function() {
        
        
        /*       console.log($scope.modalIsOpen);
        if ($scope.modalIsOpen === true){
            console.log('popin ouverte');
            $scope.show_btn.btn_menu = false;
            $scope.show_btn.btn_center =false;
            $scope.show_btn.btn_chargement =false;
        }

        else{
            console.log('popin fermé');
            $scope.show_btn.btn_menu = true;
            $scope.show_btn.btn_center =true;
            $scope.show_btn.btn_chargement =true;
        }*/
    });


    /*OUVERTURE DE LA POPIN MODAL*/
    $scope.open = function (ev,geojson,_type_action) {
        
/*             $scope.items = {caca:'caca'};

                    $mdDialog.show({
                        controller: 'ModalFicheCtrl',
                        templateUrl: 'dialog1.tmpl.html',
                        targetEvent: ev,
                        locals: {
                            items: $scope.items
                        }
                    })
                        .then(function(answer) {
                        console.log(answer);
                    }, function(cb) {
                        console.log( 'Annuler! ' + cb);
                    });*/

//        if ($scope.modalIsOpen) return; // si déjà ouvert, on fait rien

        var items = {geojson:geojson, type_action:_type_action};
        var modalInstance = $mdDialog.show({
            templateUrl: 'partial/Modal_FicheOsm.html',//'partial/Modal_FicheOsm.html',
            controller: 'ModalFicheCtrl',
           // backdrop: false,
             locals: {
                 items: items
                        }
        });

    /*    modalInstance.opened.then(function() {
            $scope.modalIsOpen = true; // La fenetre modal est ouverte ou non?$
            console.log('modal open!');
        });*/

        //lors du clic su OK. feature en geojson
        modalInstance.then(function (result) {
            
            

            //création d'un noeud
            feature = result.geojson;
            type_ope = result.type_ope;
            $scope.modalIsOpen = false;
            //console.log(type_ope);

            if (type_ope == 'W'){ //creation
                OsmFctry.crateOsmNode(feature,function(data){
                    console.log(data); 
                    /*     if(!IsNumeric(data)){
                        $scope.showAlert(true,"Une erreur est survenue pour la mise a jour de ce point",'alert-danger');
                    }*/
                    OsmFctry.getOsmElemById('node/'+data,function(_data){
                        $scope.geojson_OSM = $scope.refreshFeatureJson(type_ope,$scope.geojson_OSM,_data.osmGeojson);
                        $scope.drawMarker($scope.geojson_OSM );
                    });
                });

            }

            else if(type_ope == 'D'){
                console.log("c'est un delete!");
                OsmFctry.deleteOsmElem(feature,function(data){
                    console.log(data);
                    console.log('on rafraichi la map');
                    $scope.refreshMapData();

                });
            }
            //update d'un objet
            else { //update
                OsmFctry.UpdateOsm(feature,function(data){
                    var old_version = feature.properties.meta.version;
                    var new_version = data;
                    if ( 1 * old_version +1 != 1* new_version ){
                        $scope.showAlert(true,"Une erreur est survenue pour la mise a jour de ce point",'alert-danger'); 
                    }


                    OsmFctry.getOsmElemById(feature.id,function(_data){
                        $scope.geojson_OSM = $scope.refreshFeatureJson(type_ope,$scope.geojson_OSM,_data.osmGeojson);
                        $scope.drawMarker($scope.geojson_OSM );
                    });
                });

            }

        }, function (editable) {
            $scope.modalIsOpen = false;
            //console.log(editable);
            if(editable == true){
                console.log('on annule');

                if (type_ope == 'R'){  // c'est un update, on annule, on rafraichi lla feature dans le geojson
                    OsmFctry.getOsmElemById(feature.id,function(data){
                        console.log('++++++');
                        console.log(data.osmGeojson);
                        $scope.geojson_OSM = $scope.refreshFeatureJson(type_ope,$scope.geojson_OSM,data.osmGeojson);
                        $scope.drawMarker($scope.geojson_OSM );
                    });
                }
            }

            else{

                console.log('Modal dismissed at: ' + new Date());
            }

        });


    };



    $scope.exit = function(){
        navigator.app.exitApp();   
    }

});//FIN DU CONTROLEUR 1 

//


