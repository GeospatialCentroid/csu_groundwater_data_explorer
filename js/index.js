var csv = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQobUIOGszbmDPSGv9jpb5M1_zQgB9oUTXQDtgx2F6Oge3LxhKBRHGolid15RLVmw/pub?gid=1684074039&single=true&output=csv"
var tms_col="TMS"
var annotation_col="Annotation"
var name_col="Map Name"
var year_col="Year"
//
var map
var map_layer
var click_marker;
var side_by_side_control
var layer_rects=[]

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


    map = L.map('map').setView([40.111,-104.1378635], 7)
    L.control.scale().addTo(map);
    map.createPane('left');
   var right_pane= map.createPane('right');

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      pane: 'left',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

   // Load the spreadsheet and
   var data = $.csv.toObjects(csv_txt);
   for(var i=0;i<data.length;i++){

     load_annotation(data[i][annotation_col],{'tms':data[i][tms_col],"title":data[i][name_col]+" "+data[i][year_col]})
   }



    //
    const search = new GeoSearch.GeoSearchControl({
      provider: new GeoSearch.OpenStreetMapProvider(),
    });

   map.addControl(search);

   // get lat lng on click
   map.on('click', function(e) {
     if(click_marker){
        map.removeLayer(click_marker);
     }
     click_marker = new L.marker(e.latlng).addTo(map);
     var lat = e.latlng["lat"].toFixed(7);
     var lng = e.latlng["lng"].toFixed(7);
     var popup = L.popup().setContent(lat+","+lng);

        click_marker.bindPopup(popup).openPopup();


    });
    //

    L.control.layer_list({ position: 'bottomleft' }).addTo(map);

    map.on("moveend", function () {
      update_layer_list();
    });
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
         rect.addTo(map);
         layer_rects.push(rect)
         rect.id=layer_rects.length-1
         rect.on('click', function () {
            toggle_layer(this.id)
         });
     }

}

update_layer_list=function(){
    var html=""
    var map_bounds=map.getBounds()
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
        layer.map_layer = L.tileLayer(layer["tms"], { pane: 'right' }).addTo(map)

        // we need to make sure a layer exist first befre side to side control can function
        if(!side_by_side_control){
            side_by_side_control = L.control.sideBySide(layer.map_layer, []).addTo(map);
        }
     }else{
        map.removeLayer(layer.map_layer)
        layer.toggle="show"
     }
     $("#layer_but_"+id).html(layer.toggle)

}

