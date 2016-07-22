app.factory('ConfigFctry',function(){
    var factory = {

        // APIurl:'http://api06.dev.openstreetmap.org', //'http://api.openstreetmap.org' //http://api06.dev.openstreetmap.org
        serverAPI: null, // {type:"prod",url:"http://api.openstreetmap.org"},

        getServerAPI:function(){
            if(localStorage.getItem("server") != 'null'){
                factory.setServerAPI(localStorage.getItem("server"));
            }

            else if(!factory.serverAPI){
                factory.setServerAPI('dev');
            }

            return factory.serverAPI;
        },

        setServerAPI:function(_type){
            factory.serverAPI = (_type == 'prod') ? {type:"prod",url:"http://api.openstreetmap.org"}  : {type:"dev",url:"http://api06.dev.openstreetmap.org"};
            localStorage.setItem("server", _type);

        },

        /*GEOLOC*/
        position : {lat : 0, lng : 0, accuracy : 0, compass : 0},
        getPosition :function(){
            return factory.position;
        },
        setPositionLatLng : function(_lat,_lng,_accuracy){
            factory.position.lat = _lat;
            factory.position.lng = _lng;
            factory.position.accuracy = _accuracy;
        },
        setPositionCompass:function(_compass){
            factory.position.compass = _compass;  
        },

        /*USER*/

        user_info :{user:'', password:'',uid:'',display_name:''},
        getUserInfo:function(){
            if (factory.user_info.user ==''){ //Au démarage c'est vide, on récupère les variable dans le localstorage
                factory.setUserInfo(localStorage.getItem("user"),localStorage.getItem("password"),localStorage.getItem("uid"), localStorage.getItem("display_name") );
            }
            return factory.user_info;
        },
        getUserDetail:function(_user,_password,callback){
            var url = factory.getServerAPI().url+'/api/0.6/';
            $.ajax({
                headers: {"Authorization": "Basic " + btoa(_user+':'+_password)},
                type: "GET",
                url: url + 'user/details',
                // dataType:'xml',
                success: function(data){
                    var x_user = data.getElementsByTagName('user')[0];
                    var uid = x_user.getAttribute('id');
                    var display_name = x_user.getAttribute('display_name');
                    factory.setUserInfo(_user,_password,uid,display_name);
                    return callback(200);
                }

                ,error: function(textStatus, XMLHttpRequest, errorThrown){
                    return callback(textStatus.status);
                }
            });
        },
        setUserInfo:function(_user,_password,_uid,_display_name){
            factory.user_info ={user:_user,password:_password, uid:_uid, display_name:_display_name}; 
            localStorage.setItem("user", _user);
            localStorage.setItem("password", _password);
            localStorage.setItem("uid", _uid);
            localStorage.setItem("display_name", _display_name);
        },

        /*Renvoie l'intégralité du json tags/tags.json*/
        Tags: [],
        getTags:function(){
            //requete asynchrone
            var result = null;
            $.ajax({
                url: 'tags/tags.json',
                dataType:'json', 
                async :false,
                success: function(data){

                    var exclude_keys = factory.getExcludePrimaryKeys();
                    for (key in data){
                        if (exclude_keys.indexOf(key) !=-1){
                            data[key].display = false;
                        }
                        else {
                            data[key].display = true;
                        }
                    }

                    result = data;
                    factory.Tags = data;
                }
            })



            return result;
        },

        /*Renvoie un array des 'PrimaryKeys' present dans le fichier => ["shop", "amenity", "public_transport", "emergency", "leisure", "craft", "tourism"] Moins les keys exclut*/        
        getListOfPrimaryKey:function(){
            var tags = factory.Tags;
            var liste_primary_key = [];
            var exclude_keys = factory.getExcludePrimaryKeys();
            for (key in tags){
                if (exclude_keys.indexOf(key) ==-1){
                    liste_primary_key.push(key);
                }

            }

            return liste_primary_key;   
        },

        /*Renvoie la base map*/
        bases_map: {
            bm_osm_fr: {name:'OSM fr', layer :L.tileLayer('http://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',{maxZoom:20})},
            bm_bright_gl: {name:'MapboxGL Bright', layer: L.mapboxGL({accessToken: 'j',style: 'Mapbox-GL/styles/bright-v8.json'}) },
            mapbox_satellite : {name:'Mapbox Satellite ',  layer :L.tileLayer('http://{s}.tiles.mapbox.com/v4/openstreetmap.map-inh7ifmo/{z}/{x}/{y}.png?access_token=pk.eyJ1Ijoib3BlbnN0cmVldG1hcCIsImEiOiJncjlmd0t3In0.DmZsIeOW-3x-C5eX-wAqTw',{maxZoom:19})},
            ign_ortho: {name:'IGN ortho', layer :L.tileLayer('http://proxy-ign.openstreetmap.fr/bdortho/{z}/{x}/{y}.jpg',{maxZoom:19})}  
        },

        getBasesMaps:function(){
            return factory.bases_map;  
        },

        getBaseMap:function(){
            if (localStorage.getItem("BaseMap")){
                return localStorage.getItem("BaseMap");
            }
            else{
                factory.setBaseMap('bm_osm_fr');
                return 'bm_osm_fr';
            }

        },

        setBaseMap:function(basemap){
            localStorage.setItem("BaseMap",basemap);
        },
        
        getChangesetComment: function(){
              if (localStorage.getItem("ChangesetComment")){
                return localStorage.getItem("ChangesetComment").trim();
            }
            else{
                factory.setChangesetComment('Sortie terrain');
                return 'Sortie terrain';
            }
            
        },
        setChangesetComment: function(comment){
            localStorage.setItem("ChangesetComment",comment.trim().replace('"','"'));
        },
        

        /*Renvoie un tableau des 'PrimaryKey' a ignorer*/
        exclude_primary_keys :[],
        getExcludePrimaryKeys: function(){

            if (localStorage.getItem("excludePrimaryKeys")){
                factory.exclude_primary_keys = localStorage.getItem("excludePrimaryKeys").split('|');
            }
            else{
                localStorage.setItem("excludePrimaryKeys",'');
                factory.exclude_primary_keys = [];
            }

            //return ['amenity','craft'];
            return factory.exclude_primary_keys;
        },
        setExcludePrimaryKeys : function(key,add){ //add = false { add} else remove
            if (!add){
                if (factory.exclude_primary_keys.indexOf(key) == -1){
                    factory.exclude_primary_keys.push(key)
                }
            }
            else {
                factory.exclude_primary_keys.splice(factory.exclude_primary_keys.indexOf(key),1)
            }
            localStorage.setItem("excludePrimaryKeys", factory.exclude_primary_keys.join('|'));
        },

        /*Renvoie un tableau d'objet contenant les paramètres des tags pour une Primary Key */
        getTagsByPrimaryKey:function(_primary_key){
            var tags = factory.Tags;    
            return tags[_primary_key]['values'];
        },


        /*Renvoie l'objet de Configuration du Tag*/
        getConfigTag:function(_key,_value){
            var tags = factory.getTagsByPrimaryKey(_key);
            for (var i = 0;i<tags.length;i++){
                if(tags[i].key == _value){
                    return    tags[i];
                }
            }
            return null;
        },

        /*Renvoie le Type de l'objet OSM (shop, amenity, etc..)  {k: "amenity", v: "restaurant"}*/
        getPrimaryKeyOfObject: function(tags){
            var types_liste = factory.getListOfPrimaryKey();
            var kv = {k:'',v:''};
            for (var k in tags){
                if (types_liste.indexOf(k) != -1){
                    kv = {k:k,v:tags[k]};
                    break
                }
            }
            return kv;
        },

        /*Renvoie l'objet de Configuration du Tag*/
        getConfigSubTag:function(_key,_value){
            var tags = factory.Presets[_key].tags;
            for (var i = 0;i<tags.length;i++){
                if(tags[i].v == _value){
                    return    tags[i];
                }
            }
            return null;
        },

        Presets:[],
        /*Renvoie les "sub-tags" dans l'intégralité + charge Presets*/
        getPresets:function(){
            var result = null;
            $.ajax({
                url: 'tags/presets.json',
                dataType:'json', 
                async :false,
                success: function(data){
                    result = data;
                    factory.Presets = data;
                },
                error : function (e){
                    result = e;   
                }
            })
            return result;
        }
    }
    return factory;
});

//coleur des marker  ['red', 'blue', 'green', 'purple', 'orange', 'darkred', 'lightred', 'beige', 'darkblue', 'darkgreen', 'cadetblue', 'darkpurple', 'white', 'pink', 'lightblue', 'lightgreen', 'gray', 'black', 'lightgray'];
