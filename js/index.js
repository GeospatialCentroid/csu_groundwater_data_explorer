var csv = "https://docs.google.com/spreadsheets/d/e/2PACX-1vQobUIOGszbmDPSGv9jpb5M1_zQgB9oUTXQDtgx2F6Oge3LxhKBRHGolid15RLVmw/pub?gid=1684074039&single=true&output=csv"
var tms_col="TMS"
var map_layer
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


    var map = L.map('map').setView([40.111,-104.1378635], 7)
    L.control.scale().addTo(map);



    map.createPane('left');
   var right_pane= map.createPane('right');

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      pane: 'left',
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map)

    var data = $.csv.toObjects(csv_txt);
   for(var i=0;i<data.length;i++){
     map_layer = L.tileLayer(data[i][tms_col], { pane: 'right' }).addTo(map)
   }

    var sideBySideControl = L.control.sideBySide(map_layer, []).addTo(map);

}


