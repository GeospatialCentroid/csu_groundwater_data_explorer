var csv = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQobUIOGszbmDPSGv9jpb5M1_zQgB9oUTXQDtgx2F6Oge3LxhKBRHGolid15RLVmw/pub?gid=1684074039&single=true&output=csv"
var tms_col="TMS"
var annotation_col="Annotation"
var name_col="Map Name"
var year_col="Year"
var base_url="https://archives.mountainscholar.org/digital/api/singleitem/collection/p17393coll166/id/"
var iiif_base_url="https://archives.mountainscholar.org/iiif/2/p17393coll166:"
//
var map_manager
var map_layer
var click_marker;
var side_by_side_control
var layer_rects=[]

var params={}
var last_params={}
var usp={};// the url params object to be populated
var browser_control=false; //flag for auto selecting to prevent repeat cals

var geo_locations="https://docs.google.com/spreadsheets/d/e/2PACX-1vRbGI3aCfUlvPm1ctzPWjdHqqFueh6lZB71bK5bxh_OhGNctO317h9aQJn9C98u6rjGNan5-T4kxZA2/pub?gid=1548886854&single=true&output=csv"

function setup_params(){
     usp = new URLSearchParams(window.location.search.substring(1).replaceAll("~", "'").replaceAll("+", " "))

    if (window.location.search.substring(1)!="" && $.isEmptyObject(params)){
       if (usp.get('e')!=null){
            params['e'] =  rison.decode(usp.get('e'))
        }

    }
}

window.onload = function() {

};
$(document).ready(function() {
    load_do(csv,init)

});

function load_do(_file,_do){
    $.ajax({
        type: "GET",
        url: _file,
        dataType: "text",
        success: function(csv_txt) {
         _do(csv_txt);
         }
     });
}

function init(_csv_txt){

    setup_params()

    map_manager = new Map_Manager(
     {params:params['e'] ,
        lat:40.111,
        lng: -104.1378635,
        z:7
        })

     map_manager.init()
     // allow for iiif viewing
     map_manager.init_image()

   // Load the spreadsheet and
   var data = $.csv.toObjects(_csv_txt);
   for(var i=0;i<data.length;i++){

     load_annotation_geojson(data[i][annotation_col]+".geojson",{'annotation_url':data[i][annotation_col],'tms':data[i][tms_col],"title":data[i][name_col]+" "+data[i][year_col]})
   }
   // load the points
   console.log(geo_locations)
   load_do(geo_locations,create_geojson)
}

function save_params(){
    var p = "?"
    +"e="+rison.encode(map_manager.params)
    if(JSON.stringify(p) != JSON.stringify(last_params) && !browser_control){
       window.history.pushState(p, null, window.location.pathname+p.replaceAll(" ", "+").replaceAll("'", "~"))
        last_params = p
    }
}


create_marker=function(lat_lng){
    if(click_marker){
        map_manager.map.removeLayer(click_marker);
     }
     click_marker = new L.marker(lat_lng).addTo(map_manager.map);
     var lat = lat_lng["lat"].toFixed(7);
     var lng = lat_lng["lng"].toFixed(7);
     var html="<table id='lat_lng_table'><tr><td>"+lat+"</td><td>"+lng+"</td></tr></table>"
     html+="<a href='#' onclick='copyElementToClipboard(\"lat_lng_table\");'>copy</a>"

     var popup = L.popup().setContent(html);

        click_marker.bindPopup(popup).openPopup();

}

load_annotation_geojson= function(url,extra){
    $.ajax({
        type: "GET",
        url: url,
        dataType: "json",
        extra:extra,
        success: function(json) {
         parse_annotation(json,extra);
         }
     });
}
parse_annotation= function(json,extra){
         var rect =   L.geoJson(json, {pane: 'left',color: 'blue'})
         rect.title=extra["title"]
         rect.tms=extra["tms"]
         rect['annotation_url']=extra['annotation_url']
         rect.toggle="show"
         rect.addTo(map_manager.map);
         layer_rects.push(rect)
         rect.id=layer_rects.length-1
         rect.on('click', function () {
            toggle_layer(this.id)
            this.off('click')
         });
}

update_layer_list=function(){
    var html=""
    var map_bounds=map_manager.map.getBounds()
    for(var i =0;i<layer_rects.length;i++){
        if(map_bounds.intersects(layer_rects[i].getBounds())){
            html+=layer_rects[i].title+" <a id='layer_but_"+i+"' href='#' onclick='toggle_layer("+i+");'>"+layer_rects[i].toggle+"</a><br/>"

        }

    }
    $("#layer_list").html(html)
}
toggle_layer = function(id){
    var layer = layer_rects[id]
    if(layer.toggle=="show"){
        layer.toggle="hide"
        layer.map_layer =new Allmaps.WarpedMapLayer(layer['annotation_url'],{pane: 'right'})
        map_manager.map.addLayer(layer.map_layer)
        // we need to make sure a layer exist first before side to side control can function
        if(!side_by_side_control){
            side_by_side_control = L.control.sideBySide(layer.map_layer, []).addTo(map_manager.map);
        }
     }else{
        map_manager.map.removeLayer(layer.map_layer)
        layer.on('click', function () {
            toggle_layer(this.id)
            this.off('click')
         });
        layer.toggle="show"
     }
     $("#layer_but_"+id).html(layer.toggle)

}
function create_geojson(_data){
       var data = $.csv.toObjects(_data);
     var output_json={ "type": 'FeatureCollection', "features": []}
   for(var i=0;i<data.length;i++){
        if(data[i]["Well #"]!=""){

            obj_props={
            "title":data[i]["Title"],
            "info_page":data[i]["Reference URL"],
            "thumb_url":base_url+data[i]["CONTENTdm number"]+"/thumbnail",
            "well":data[i]["Well #"],
            "iiif":iiif_base_url+data[i]["CONTENTdm number"]+"/info.json",
             "attribution":data[i]["Title"],
           /* "creato":data[i]["Creator"],
            "date":data[i]["Date"],*/
              }
            output_json["features"].push({ "type": 'Feature', "properties": obj_props,
                           "geometry":{"type": 'Point',"coordinates": [Number(data[i]["Longitude"]),Number(data[i]["Latitude"])]}})
        }
   }
    show_geojson(output_json)
}
function show_geojson(_data){
      var geojson_markers;
      var clusteredPoints = L.markerClusterGroup();
      console.log(_data.features.length)
        var geojson_markers = L.geoJson(_data, {
          onEachFeature: function (feature, layer) {
                //+feature.properties.info_page+
              layer.bindPopup('<h3>'+feature.properties.title+'</h3><a href="javascript:void(0);" onclick="map_manager.show_image(\''+feature.properties.iiif+'\',\''+feature.properties.attribution+'\')" ><img class="center" src="'+feature.properties.thumb_url+'" alt="'+feature.properties.title+'"></a>'
              +'<br/>Well #: '+feature.properties.well);
                //<br/>Creator: '+feature.properties.creato+'<br/>Date: '+feature.properties.date+''
          },
          pointToLayer: function (feature, latlng) {
                return L.marker(latlng, {icon: get_marker_icon()});
            }
        });
        clusteredPoints.addLayer(geojson_markers);
        map_manager.map.addLayer(clusteredPoints);

    }

function get_marker_icon(){
        // define a default marker
        return L.divIcon({
          className: "marker_div",
          iconAnchor: [0, 8],
          labelAnchor: [-6, 0],
          popupAnchor: [0, -36],
          html: '<span class="marker" />'
         })
    }
function parse_township_section_geojson(data){
    var feature = L.geoJson(JSON.parse(data))//.addTo(map_manager.map);
    map_manager.map.fitBounds(feature.getBounds());
    create_marker(feature.getBounds().getCenter())
    //show success
    $("#bearing").removeClass("option_error")
    $("#bearing").addClass("option_valid")
}

function copyElementToClipboard(element) {
  window.getSelection().removeAllRanges();
  let range = document.createRange();
  range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
}
