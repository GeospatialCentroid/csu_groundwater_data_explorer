var csv = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQobUIOGszbmDPSGv9jpb5M1_zQgB9oUTXQDtgx2F6Oge3LxhKBRHGolid15RLVmw/pub?gid=1684074039&single=true&output=csv"
var tms_col="TMS"
var annotation_col="Annotation"
var name_col="Map Name"
var year_col="Year"
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

    $.ajax({
        type: "GET",
        url: csv,
        dataType: "text",
        success: function(csv_txt) {
         init(csv_txt);
         }
     });
});

function init(csv_txt){
     setup_params()


    map_manager = new Map_Manager(
     {params:params['e'] ,
        lat:40.111,
        lng: -104.1378635,
        z:7
        })

     map_manager.init()


   // Load the spreadsheet and
   var data = $.csv.toObjects(csv_txt);
   for(var i=0;i<data.length;i++){

     load_annotation(data[i][annotation_col],{'tms':data[i][tms_col],"title":data[i][name_col]+" "+data[i][year_col]})
   }
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

load_annotation= function(url,extra){
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
     for (var i=0;i<json.items.length;i++){
        var latlngs = [];

         for (var p=0;p<json.items[i].body.features.length;p++){
             var coors=json.items[i].body.features[p].geometry.coordinates
             latlngs.push([coors[1],coors[0]])
         }
         var bounds = L.polygon(latlngs).getBounds()
         var rect = L.rectangle(bounds, {pane: 'left',color: 'blue'})
         rect.title=extra["title"]
         rect.tms=extra["tms"]
         rect.toggle="show"
         rect.addTo(map_manager.map);
         layer_rects.push(rect)
         rect.id=layer_rects.length-1
         rect.on('click', function () {
            toggle_layer(this.id)
            this.off('click')
         });
     }

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
        layer.map_layer = L.tileLayer(layer["tms"], { pane: 'right',interactive:true }).addTo(map_manager.map)

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

function copyElementToClipboard(element) {
  window.getSelection().removeAllRanges();
  let range = document.createRange();
  range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
}
