
//var base_url="https://archives.mountainscholar.org/digital/api/singleitem/collection/p17393coll166/id/"
//var iiif_base_url="https://archives.mountainscholar.org/iiif/2/p17393coll166:"
//
//field_data_url="https://docs.google.com/spreadsheets/d/e/2PACX-1vSDqaQMTu6Peq8FV8Z6lBW2hr9uz2kQ4s3RaW98W0p9Kq-UsE88yrEybWwUzJdfAsuW9RQptY-dibbf/pub?output=csv"
//field_data_post_url="https://script.google.com/macros/s/AKfycbz_A2MSHJ5Zd2szCC5oWkkFcTKZ1_VjnuEl_ywpwnrkvKk-6ZZU0y9hZRAGGSoaM1dhrQ/exec"

//
var map_manager;
var map_layer;
var layer_manager;
var table_manager;
var click_marker;
var side_by_side_control
var layer_rects=[]

var image_manager

var transcription
var transcription_mode;

var params={}
var last_params={}
var usp={};// the url params object to be populated
var browser_control=false; //flag for auto selecting to prevent repeat cals

//var geo_locations="https://docs.google.com/spreadsheets/d/e/2PACX-1vRbGI3aCfUlvPm1ctzPWjdHqqFueh6lZB71bK5bxh_OhGNctO317h9aQJn9C98u6rjGNan5-T4kxZA2/pub?gid=1548886854&single=true&output=csv"


function setup_params(){
     usp = new URLSearchParams(window.location.search.substring(1).replaceAll("~", "'").replaceAll("+", " "))

    if (window.location.search.substring(1)!="" && $.isEmptyObject(params)){
       if (usp.get('e')!=null){
            params['e'] =  rison.decode(usp.get('e'))
        }
        //support passing contentdm id
        if (usp.get('id')!=null){
            params['id'] =  usp.get('id')
        }
        if (usp.get('t')!=null){
           console.log("transcription mode")
           transcription_mode=true;
        }
        // debug mode
        if (usp.get('d')!=null){
           DEBUGMODE=true
        }
    }
}
$( function() {

    $.getJSON('i18n/en.json', function(data){
            LANG=data
            initialize_interface()
    });


});

function initialize_interface() {
    setup_params()

    map_manager = new Map_Manager(
     {params:params['e'] ,
        lat:40.111,
        lng: -104.1378635,
        z:7
        })
      table_manager = new Table_Manager({
        elm_wrap:"data_table_wrapper",
          elm:"data_table"})

    map_manager.init()

    image_manager = new Image_Manager({params:{}})

     // allow for iiif viewing
     image_manager.init()
     if(params['id']){
        //todo need to capture the variable
       //image_manager.show_image(iiif_base_url+params['id']+"/info.json","")
     }

     layer_manager = new Layer_Manager({
        map:map_manager.map,
        layers_list:params['l'],
        service_method:services//loaded in html

      })

      layer_manager.add_basemap_control()


    section_manager=new Section_Manager({config:"app.csv",map_manager:map_manager})
    filter_manager = new Filter_Manager({
        section_manager:section_manager,

    });
    section_manager.init();
    //to do load data when ready
    //load_do(csv,init)

}
function after_filters(){
    console.log("after_filters")
}


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

   // load the points
   load_do(geo_locations,save_marker_data)

    if(transcription_mode){
        transcription = new Transcription({
        field_data_post_url:field_data_post_url,
        })
        load_do(field_data_url,save_transcription_data)
    }

}
function save_marker_data(_data){
    map_manager.data = $.csv.toObjects(_data);
    check_all_loaded();
}
function save_transcription_data(_data){
    transcription.data = $.csv.toObjects(_data);
    check_all_loaded();
}

function check_all_loaded(){

    //if we are transcribing we need to make sure that both the geolocated sheets
    //and the transcriptions are loaded
  if(transcription_mode){
    if(transcription.data && map_manager.data){
     transcription.group_transcription()
     transcription.connect_transcription()
     map_manager.create_geojson()
    }

  }else{
     map_manager.create_geojson()

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
        console.log("side by side")
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


function connect_transcription(_data){
     var data = $.csv.toObjects(_data);
     for(var i=0;i<data.length;i++){
            console.log(data[i])
     }
}


function copyElementToClipboard(element) {
  window.getSelection().removeAllRanges();
  let range = document.createRange();
  range.selectNode(typeof element === 'string' ? document.getElementById(element) : element);
  window.getSelection().addRange(range);
  document.execCommand('copy');
  window.getSelection().removeAllRanges();
}

function run_resize(){
    $( window ).resize( window_resize);
    setTimeout(function(){
             $( window ).trigger("resize");

             // leave on the dynamic links - turn off the hrefs
             $("#browse_panel .card-body a").attr('href', "javascript: void(0)");

             // rely on scroll advance for results
             $("#next_link").hide();


            // update paging
//            filter_manager.update_parent_toggle_buttons(".content_right")
//            filter_manager.update_parent_toggle_buttons("#details_panel")
//            filter_manager.update_toggle_button()
            if(! DEBUGMODE){
                $("#document .page_nav").hide()
            }else{
                //append d=1, so that debug mode remains
                $("#document .page_nav a").each(function() {
                   $(this).attr("href",  $(this).attr("href") + '&d=1');
                });
            }
            $("#content").show();
           map_manager.map.invalidateSize()
    },100)
        //update the height of the results area when a change occurs
//        $('#side_header').bind('resize', function(){
//
//    });

}
function window_resize() {
        var data_table_height=0
         if( $("#data_table_wrapper").is(":visible")){
           data_table_height= $("#data_table_wrapper").height()
        }
        var header_height=$("#header").outerHeight()+20;
        var footer_height=15//$("#footer").height()
        var window_height= $(window).outerHeight()
        var window_width= $(window).width()
        var minus_height=header_height+footer_height
        console.log("CONTENT HEIGHT",window_height,minus_height,header_height,footer_height)
       $("#content").height(window_height-minus_height)

       $("#map_wrapper").height(window_height-minus_height-data_table_height)
       var scroll_height=window_height-minus_height-$("#side_header").outerHeight()
       //-$("#tabs").outerHeight()-$("#nav_wrapper").outerHeight()
       $("#panels").height(scroll_height)
       $(".panel").height(scroll_height)

//        $("#map_panel_wrapper").height(window_height-$("#tabs").height()-minus_height)
//        $("#map_panel_scroll").height(window_height-$("#tabs").height()-minus_height)

            //
//       $("#tab_panels").css({'top' : ($("#tabs").height()+header_height) + 'px'});

//       .col-xs-: Phones (<768px)
//        .col-sm-: Tablets (≥768px)
//        .col-md-: Desktops (≥992px)
//        .col-lg-: Desktops (≥1200px)


       if (window_width >768){

            // hide the scroll bars
            $('html, body').css({
                overflow: 'hidden',
                height: '100%'
            });
            $("#map_wrapper").width(window_width-$("#side_bar").width()-1)
            $("#data_table_wrapper").width(window_width-$("#side_bar").width()-1)

            map_manager.map.scrollWheelZoom.enable();
       }else{
             //mobile view

             // scroll as needed
             $('html, body').css({
                overflow: 'auto',
                height: 'auto'
            });

            // drop the map down for mobile
            $("#map_wrapper").width(window_width)
            $("#data_table_wrapper").width(window_width)

            map_manager.map.scrollWheelZoom.disable();
       }
        //final sets
        $("#panels").width($("#side_bar").width())
        $(".panel").width($("#side_bar").width())
        if(map_manager){
            map_manager.map.invalidateSize()
        }
        // slide to position
         $("#panels").stop(true, true)
         // if we are on the search tab, make sure the viewable panel stays when adjusted
        if("search_tab"==$("#tabs").find(".active").attr("id")){
            section_manager.slide_position(section_manager.panel_name)
        }

        $("#result_wrapper").css({"height":scroll_height-$("#filter_area").height()})

 }