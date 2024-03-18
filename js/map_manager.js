class Map_Manager {
  constructor(properties) {

  for (var p in properties){
        this[p]=properties[p]
    }
    if (this.params){
        if (this.params.hasOwnProperty('z')){
            this.z = Number(this.params['z'])
        }
         if (this.params.hasOwnProperty('c')){
            var c = this.params['c'].split(',')
            this.lat= Number(c[0])
            this.lng = Number(c[1])
        }

    }else{
        this.params={}
    }
     this.map = L.map('map').setView([this.lat, this.lng], this.z);
  }
  init(){
     L.control.scale().addTo( this.map);
     this.map.createPane('left');
    var right_pane=  this.map.createPane('right');

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    pane: 'left',
    attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo( this.map)


     //
    const search = new GeoSearch.GeoSearchControl({
      provider: new GeoSearch.OpenStreetMapProvider(),
    });

    this.map.addControl(search);

   // get lat lng on click
    this.map.on('click', function(e) {
     create_marker(e.latlng)


    });
    //

    L.control.layer_list({ position: 'bottomleft' }).addTo( this.map);

     L.control.location_search({ position: 'topleft' }).addTo( this.map);
     var search_html=""
     search_html+='<input type="text" id="search_text" name="search_text">'
     search_html+='<button type="submit" id="search_location">search</button>'
     $("#location_search").append(search_html)

     $("#search_location").on('click',function(){
      var lat_lng=$("#search_text").val().split(",").map( Number )
       lat_lng=new L.latLng(lat_lng[0],lat_lng[1])
        create_marker(lat_lng)
     })


    this.map.on("moveend", function () {
      update_layer_list();
      var c =  map_manager.map.getCenter()
         map_manager.set_url_params("c",c.lat+","+c.lng)
         map_manager.set_url_params("z", map_manager.map.getZoom())
         save_params()
    });

  }
    move_map_pos(_params){
        var z = Number(_params['z'])
        var c = _params['c'].split(',')
        var lat= Number(c[0])
        var lng = Number(c[1])
         this.map.setView([lat, lng], z, {animation: true});
    }

    set_url_params(type,value){
        // allow or saving details outside of the filter list but
        //added to the json_str when the map changes
         this.params[type]= value

    }
    //

     

 }