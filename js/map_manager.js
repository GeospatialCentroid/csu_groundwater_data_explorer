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
     this.map = L.map('map',{doubleClickZoom: false}).setView([this.lat, this.lng], this.z);

     // track image_layer
     this.image_layer;
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
    this.map.on('dblclick', function(e) {
     create_marker(e.latlng)


    });
    //

    L.control.layer_list({ position: 'bottomleft' }).addTo( this.map);

     L.control.location_search({ position: 'topleft' }).addTo( this.map);
     var search_html=""
     search_html+='<input type="text" id="search_text" name="search_text" placeholder="lat,lng or Well #" >'// value="2-59-8"
     search_html+='<select name="bearing" id="bearing"><option value="NW">NW</option><option value="SW">SW</option><option value="NE">NE</option><option value="SE">SE</option></select>'
     search_html+='<button type="submit" id="search_location">search</button>'
     $("#location_search").append(search_html)

     $("#search_location").on('click',function(){
      if($("#search_text").val().indexOf(",")>-1){
        var lat_lng=$("#search_text").val().split(",").map( Number )

        lat_lng=new L.latLng(lat_lng[0],lat_lng[1])
        create_marker(lat_lng)
        }else{
            // we're working with and a well #
            // start by parsing the sections
            //Well #" 2-59-8 is actually Sec 8, T 2, R 59
            //B7-66-14dcc
            var well_nums=$("#search_text").val().split("-")
            for (var i=0;i<well_nums.length;i++){
                well_nums[i]= well_nums[i].replace(/[A-z]/g, '')
                if( i==2 && well_nums[i].length==1){
                    well_nums[i]="0"+well_nums[i]
                }
            }
            var bearing = $("#bearing").val().split("")
            var township_section_name=well_nums[0]+bearing[0]+"+"+well_nums[1]+bearing[1]+"+"+well_nums[2]//"12S+73W+08" - 012,120,102,021,210,201
            var url="https://services5.arcgis.com/rqsYvPKZmvSrSWbw/arcgis/rest/services/PLSS_2020_VIEW/FeatureServer/2/query?where=Search_Name%3D%27"+township_section_name+"%27&fullText=&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&relationParam=&returnGeodetic=false&outFields=*&returnGeometry=true&returnCentroid=false&returnEnvelope=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token="
            $("#bearing").removeClass("option_valid")
            $("#bearing").addClass("option_error")
            load_do(url,parse_township_section_geojson)
        }
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
    // allow iiif images to show in same window
    init_image(){
            this.image_map = L.map('image_map', {
             center: [0, 0],
              zoom:  1,
              crs: L.CRS.Simple,

        })
        this.image_map._resetView(this.image_map.getCenter(), this.image_map.getZoom());
        }
     show_image(img,attribution){
        $("#image_map").width("75%")
        $("#image_map").show()
         $("#map").width("25%")
         $("#map").css({'left':"75%"})
         //$("#leaflet_spinner").show();
        console.log(this.image_layer)
         if(this.image_layer){
            map_manager.image_map.removeLayer(this.image_layer);
        }

        this._img =L["tileLayer"]["iiif"](img)
        this._img.addTo(this.image_map);
        this.image_layer = this._img; // store for future reference

        this._img.on('load', function (e) {
            console.log("image Load complete")
            $("#leaflet_spinner").hide();
        });
        this.map.invalidateSize(true)
        this.image_map.invalidateSize(true)

        this.image_map.attributionControl._attributions = {};
        this.image_map.attributionControl.addAttribution(attribution);

     }
    hide_image(){

        $("#image_map").hide()
         $("#map").width("100%")
         $("#map").css({'left':"0px"})
          this.map.invalidateSize(true)
    }
 }