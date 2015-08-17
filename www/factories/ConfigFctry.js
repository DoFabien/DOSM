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
        user_info :{user:'', password:''},
        getUserInfo:function(){
            if (factory.user_info.user ==''){
                factory.setUserInfo(localStorage.getItem("user"),localStorage.getItem("password"));
            }
            return factory.user_info;
        },
        setUserInfo:function(_user,_password){
            factory.user_info ={user:_user,password:_password}; 
            localStorage.setItem("user", _user);
            localStorage.setItem("password", _password);
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
                    result = data;
                    factory.Tags = data;
                }
            })
            return result;
        },

        /*Renvoie un array des 'PrimaryKeys' present dans le fichier*/        
        getListOfPrimaryKey:function(){
            var tags = factory.Tags;
            var liste_primary_key = [];
            for (key in tags){
                liste_primary_key.push(key);
            }
            return liste_primary_key;   
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
            var tags = factory.SubTags[_key].tags;
            for (var i = 0;i<tags.length;i++){
                if(tags[i].v == _value){
                    return    tags[i];
                }
            }
            return null;
        },

        SubTags:[],
        /*Renvoie les "sub-tags" dans l'intégralité + charge SubTags*/
        getSubTags:function(){
            var result = null;
            $.ajax({
                url: 'tags/sub_tags.json',
                dataType:'json', 
                async :false,
                success: function(data){
                    result = data;
                    factory.SubTags = data;
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
