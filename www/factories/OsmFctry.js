app.factory('OsmFctry',['ConfigFctry', function(ConfigFctry) {


    var factory = {
        geojson_OSM:null, //stockage des données en json

        getGeojsonOsm: function(){
            return factory.geojson_OSM;  
        },
        setGeojsonOsm :function(data,bbox_geojson){

            if (!factory.getGeojsonOsm()){ //Il n'y a pas de data
                factory.geojson_OSM = data;  
            }

            else{ //on a déjà des données

                //  le cas où une feature a été supprimé entre temps, on doit la supprimer de nos données:
                var id_features_deleted = [];
                for (var i = 0; i<factory.geojson_OSM.length;i++){ // si la feature est dans la BBOX, on la push
                    if(turf.inside(factory.geojson_OSM[i], bbox_geojson)){
                        id_features_deleted.push(factory.geojson_OSM[i].id)
                    }
                }

                for (var i = 0; i<data.length;i++){
                    var feature_id = data[i].id;
                    var ind_id = id_features_deleted.indexOf(feature_id);
                    for (var j = 0; j<factory.geojson_OSM.length;j++){
                        if (feature_id == factory.geojson_OSM[j].id){ //la feature existe déjà dans nos données, on la remplace
                            factory.geojson_OSM[j] = data[i];
                            id_features_deleted.splice(id_features_deleted.indexOf(feature_id), 1); //la feature existe toujours, on la supprime du tableau
                            break;
                        }
                        if (j == factory.geojson_OSM.length -1){   //la feature n'existe pas, on l'ajoute
                            factory.geojson_OSM.push(data[i]);
                        }
                    }
                }

                //parcours les features qui ont été supprimées pour les supprimer de nos données.
                for(var i=0;i<id_features_deleted.length;i++){ 
                    var id_to_delete = id_features_deleted[i];
                    for(var j=0;j<factory.geojson_OSM.length;j++){
                        if(factory.geojson_OSM[j].id == id_to_delete){
                            factory.geojson_OSM.splice(j,1);
                            break;
                        }
                    }

                }

            }
        },

        clearGeojsonOsm:function(){
            factory.geojson_OSM = null;
            factory.bbox_data = null;

        },

        addFeatureToGeojsonOsm:function(feature){
            factory.geojson_OSM.push(feature);
            console.log('add feature!');
        },
        updateFeatureToGeojsonOsm:function(feature){
            var feature_id = feature.id;
            for (var j = 0; j<factory.geojson_OSM.length;j++){
                if (feature_id == factory.geojson_OSM[j].id){ //la feature existe déjà dans nos données, on la remplace
                    if(feature.properties.type == 'way'){ // si c'est un plolygon, on récupère l'ancienne géométrie
                        feature.geometry.coordinates =factory.geojson_OSM[j].geometry.coordinates;
                    }
                    factory.geojson_OSM[j] = feature;
                    break;
                }
            }
            console.log('update feature!');
        },
        deleteFeatureToGeojsonOsm: function(feature){
            var feature_id = feature.id;
            for (var j = 0; j<factory.geojson_OSM.length;j++){
                if (feature_id == factory.geojson_OSM[j].id){ 
                    if(feature.properties.type != 'way'){ // On ne peut pas supprimer un polygon
                        factory.geojson_OSM.splice(j,1);
                        console.log('delete feature!');
                    }
                    break;
                }
            }


        },

        bbox_data: null,
        getBboxData : function(){
            return factory.bbox_data;

        },
        setBboxData:function(bbox){
            factory.bbox_data = bbox; 
        },


        changeset : {id:'', datechange:0},
        getChangeset:function(){
            return factory.changeset;
        },
        setChangeset:function(_id,_datechange){ // alimente changeset + localstorage
            factory.changeset = {id:_id,datechange:_datechange};  //to do => ajouter le serveur?
            localStorage.setItem("idchangeset", _id);
            localStorage.setItem("last_changeset_activity", _datechange);
        },

        geojson2OSM:{ // converti le geojson en XML osm en vu de l'envoyer à l'API
            create:  function(geojson,id_changeset){
                var tags_json = geojson.properties.tags;
                var type_objet = geojson.properties.type;
                var lng = geojson.geometry.coordinates[0];
                var lat = geojson.geometry.coordinates[1];

                var node_header = '<node changeset="'+id_changeset+'" lat="'+lat+'" lon="'+lng+'">';
                var tags_xml = '';
                for (var k in tags_json){ // TODO : si k se terminer _1, _2, _N, supprimer la fin (le geojson ne peut pas avoir 2 fois la meme clé, le XML si.??? Duplication de clé
                    if(k != '' && tags_json[k] != ''){

                        tags_xml += '<tag k="'+k+'" v="'+tags_json[k]+'"/>';
                    }
                }
                var xml =  '<osm>'+node_header+tags_xml+'</node></osm>'

                return (xml);

            },
            update: function(geojson){
                var id_changeset = factory.getChangeset().id;

                var tags_json = geojson.properties.tags;
                var type_objet = geojson.properties.type;
                var version = geojson.properties.meta.version;
                var id = geojson.properties.id;

                if (type_objet == 'node'){
                    var lng = geojson.geometry.coordinates[0];
                    var lat = geojson.geometry.coordinates[1];
                    var node_header = '<node id="'+id+'" changeset="'+id_changeset+'" version="'+version+'" lat="'+lat+'" lon="'+lng+'">';                   
                    var tags_xml = '';
                    for (var k in tags_json){
                        if(k != '' && tags_json[k] != ''){

                            // console.log(k.replace(/_[0-9]+/i, "")); Impossible de dupliquer une clé d'après l'API
                            //tags_xml += '<tag k="'+k+'" v="'+tags_json[k]+'"/>';
                            tags_xml += '<tag k="'+k.replace(/_[0-9]+/i, "")+'" v="'+tags_json[k]+'"/>';
                        }
                    }
                    var xml =  '<osm>'+node_header+tags_xml+'</node></osm>'

                    return (xml);
                }

                else if(type_objet == 'way'){
                    var way_header = '<way id="'+id+'" changeset="'+id_changeset+'" version="'+version+'">';
                    var tags_xml = '';
                    for (var k in tags_json){
                        if(k != '' && tags_json[k] != ''){
                            tags_xml += '<tag k="'+k+'" v="'+tags_json[k]+'"/>';
                        }
                    }
                    var nd_ref_xml = '';
                    for(var i = 0; i<geojson.properties.nds_ref.length; i++){
                        nd_ref_xml += '<nd ref="'+geojson.properties.nds_ref[i]+'"/>'
                    }

                    var xml =  '<osm>'+way_header+nd_ref_xml+tags_xml+'</way></osm>'
                    return xml;
                }

            }
        },

        getOsmElemById:function(id,callback){
            var type = id.split('/')[0];

            var url = ConfigFctry.getServerAPI().url+'/api/0.6/';
            $.ajax({
                type: "GET",
                url: url + id,
                dataType:'xml',
                success: function(data){

                    var osm_elem = data;
                    if(type=='node'){
                        var geojson_elem = osmtogeojson(data).features ;// ne fonctionne que pour les points. Pour les ways prendre la géom envoyé
                        return callback({osmXML:data,osmGeojson:geojson_elem[0]});
                    }
                    else {
                        osmPolygon2pseudoGeojson(data);
                        return callback({osmXML:data,osmGeojson:osmPolygon2pseudoGeojson(data)});
                    }
                }
            });
        },

        getGeojsonByBbox:function(_ks,l_bounds,callback){
            var bb = (l_bounds.getWest()+','+l_bounds.getSouth()+','+l_bounds.getEast()+','+l_bounds.getNorth());
            var url = ConfigFctry.getServerAPI().url+'/api/0.6/';

            $.ajax({
                type: "GET",
                url: url +'map?bbox='+ bb,
                success: function(data){
                    var elements = [];
                    var features = osmUpdateNdrefToFeatures(data,osmtogeojson(data).features);

                    for (var i = 0;i<features.length;i++){
                        feature_tag = features[i].properties.tags;
                        if ( features[i].geometry.type == 'Point'){
                            elements.push(features[i]);
                        }

                        else if (features[i].geometry.type == 'Polygon' || features[i].geometry.type == 'LineString'){
                            features[i].properties.way_geometry = $.extend(true, {},turf.flip(features[i].geometry)); //on stocke la géometrie du polygon
                            var way_geojson = (features[i].geometry.type == 'Polygon') ? L.multiPolygon(features[i].geometry.coordinates).toGeoJSON() : L.polyline(features[i].geometry.coordinates).toGeoJSON();
                            var center_way = turf.flip(turf.pointOnSurface(way_geojson)).geometry.coordinates; //pointOnSurface => point SUR le polygon
                            features[i].geometry.coordinates = center_way;
                            features[i].geometry.type = 'Point';
                            elements.push(features[i]);
                        }

                    }
                    return callback(elements);   
                }
            });

        },


        getOsmPermission : function (username,password,callback){
            var url = ConfigFctry.getServerAPI().url+'/api/0.6/changeset/create';

            $.ajax({
                headers: {"Authorization": "Basic " + btoa(username+':'+password)},
                type: "PUT",
                url: url,
                error: function(textStatus, XMLHttpRequest){
                    if (textStatus.status == 400){
                        ConfigFctry.setUserInfo(username,password);
                        return callback(textStatus.status); 
                    }
                    else{
                        return callback(textStatus.status);
                    }
                }
            });
        },

        getStatutChangeSet:function(id_CS,callback){
            console.log('id_CS');
            url = ConfigFctry.getServerAPI().url+'/api/0.6/changeset/'+id_CS;
            $.ajax({
                type: "GET",
                url: url,
                dataType: "xml",
                success: function(data){
                    var open = data.getElementsByTagName("changeset")[0].getAttribute("open");
                    var user = data.getElementsByTagName("changeset")[0].getAttribute("user");
                    return callback({open:open, user:user});   
                }
            });

        },

        createOSMChangeSet:function(callback){

            var url = ConfigFctry.getServerAPI().url+'/api/0.6/changeset/create';
            var content_put = '<osm><changeset><tag k="created_by" v="DOSM"/><tag k="comment" v="'+ConfigFctry.getChangesetComment()+'"/></changeset></osm>';
            $.ajax({
                headers: {"Authorization": "Basic " + btoa(ConfigFctry.getUserInfo().user+':'+ConfigFctry.getUserInfo().password)},
                type: "PUT",
                url: url,
                data:content_put,
                error:function(er){
                    return er;
                },
                success: function(data){
                    return callback(data);   
                }
            });

        },
        //determine si le changset est valide, sinon on en crée un nouveau
        getValidChangset:function(callback){
            //si il n'existe pas
            if (factory.getChangeset().id == null || factory.getChangeset().id == '' ){
                factory.createOSMChangeSet(function(id_new_CS){
                    factory.setChangeset(id_new_CS,Date.now());
                    callback(factory.getChangeset().id);

                });
            }
            else if ( (Date.now() - factory.getChangeset().datechange)/1000 > 3540) {  //factory.getChangeset().id === 0 ||
                console.log("bientot périmé");
                factory.getStatutChangeSet(factory.changeset.id,function(data){
                    if (data.open == "false"){ //c'est fermé, on en crée un nouveau
                        factory.createOSMChangeSet(function(id_new_CS){
                            factory.setChangeset(id_new_CS,Date.now());


                            callback(factory.getChangeset().id);
                        });
                    }
                    else {callback(factory.getChangeset().id); } //encore ouvert
                });
            }

            else{ return callback(factory.getChangeset().id);}
        },
        crateOsmNode:function(geojson,callback){
            factory.getValidChangset(function (change_set_id){

                var url = ConfigFctry.getServerAPI().url+'/api/0.6/node/create';
                var content_put = factory.geojson2OSM.create(geojson,change_set_id);

                $.ajax({
                    headers: {"Authorization": "Basic " + btoa(ConfigFctry.getUserInfo().user+':'+ConfigFctry.getUserInfo().password)},
                    type: "PUT",
                    url: url,
                    data:content_put,
                    success: function(data){
                        return callback(data);   
                    }
                });//EOF ajax
            }

                                    );
        },
        UpdateOsm: function(geojson,callback){
            factory.getValidChangset(function (change_set_id){
                var id = geojson.id;

                var url = ConfigFctry.getServerAPI().url+'/api/0.6/'+id;
                var content_put = factory.geojson2OSM.update(geojson);


                $.ajax({
                    headers: {"Authorization": "Basic " + btoa(ConfigFctry.getUserInfo().user+':'+ConfigFctry.getUserInfo().password)},
                    type: "PUT",
                    url: url,
                    data:content_put,
                    success: function(data){
                        return callback(data);   
                    }
                });//EOF ajax

            }

                                    );
        },


        deleteOsmElem: function(geojson,callback){
            factory.getValidChangset(function (change_set_id){
                var id = geojson.id;
                var content_delete = factory.geojson2OSM.update(geojson);
                var url = ConfigFctry.getServerAPI().url+'/api/0.6/'+id;

                if(geojson.properties.type == 'node'){
                    $.ajax({
                        headers: {"Authorization": "Basic " + btoa(ConfigFctry.getUserInfo().user+':'+ConfigFctry.getUserInfo().password)},
                        type: "DELETE",
                        url: url,
                        data:content_delete,
                        success: function(data){
                            //Precondition failed: Node 4297420791 is still used by relations 4296366138.
                            return callback(data);   
                        }
                    });//EOF ajax
                }
            });
        }


    }

    return factory;
}]);
