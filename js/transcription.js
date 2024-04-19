/*
The following class allows users to transcribe a datasheet.
It's important to know what has been transcribed and what hasn't, so all the transcribed data will be loaded when the application first opens.
Any datasheet that hasn't been transcribed will be highlighted (white outline).
There alos needs to be a way to hide/show data that has already been transcribed

For datasheet with existing transcriptions, these will be visible to the user to verify when they open a field data sheet.

** we need to make sure the geolocated data and the transcriptions are loaded before drawing the markers

When a user is looking at data sheet, they will be given the option to transcribe the sheet
    This will popup a window with a single entry for them to fill out and duplicate
        **when duplicating an entry, The new entry will be highlighted until focus has been entered

*/

class Transcription {
      constructor(properties) {
        for (var p in properties){
            this[p]=properties[p]
        }
        this.empty_form=$("#data_form").clone();
      }
    group_transcription(_data){
        //step 1. create json objects storing all the records under one id
        this.grouped_data={}
        for(var i=0;i<_data.length;i++){
            //check if id has been seen before
            if (typeof(this.grouped_data[_data[i].id])=="undefined"){
                this.grouped_data[_data[i].id]=[]
            }
             this.grouped_data[_data[i].id].push(_data[i])

        }
    }
    connect_transcription(_data){
        for(var i in this.grouped_data){
            //find a match with the markers
            for(var m=0;m<_data.length;m++){
                if(_data[m]["CONTENTdm number"]==i){
                    _data[m].data=this.grouped_data[i]
                    break
                }

            }
        }
        return _data
    }

    show_form(_id){
        //need to reset the form
        $("#data_form").html(this.empty_form.html())
        $('#model_data_form').modal('show');
        //data_form
        this.setup_date_field()
        //populate id
        $(".data_sheet_id").val(_id)
        var timestamp=new Date()
          this.show_data(_id)
    }
    show_data(_id){
          var html=""
         //use the _id to see whether there is data
          if (typeof(this.grouped_data[_id])!="undefined"){

                for(var i=0;i<this.grouped_data[_id].length;i++){
                      html+='<div class="row">'
                      html+='<div class="col">'+this.grouped_data[_id][i].date+'</div>'
                       html+='<div class="col">'+this.grouped_data[_id][i].measure+'</div>'
                      html+='</div>'
                }

          }
         $("#transcription_data").html(html);
    }
    setup_date_field(){
        $(".data_form_date").datetimepicker({
            timepicker:false,
            format:'Y-m-d',
            mask:true
        });
    }
    duplicate_row(elm){
      $(elm).parent().parent().parent().append($(elm).parent().parent().clone())
      this.setup_date_field()

    }
    post_all_forms(){
     $("#data_form_save_but").prop("disabled",true);
        $("#data_form_save_but").addClass("progress-bar progress-bar-striped progress-bar-animated");
        var $this=this
        this.posts=[]
        $("#data_form").children().each(function( index ) {
         var p={}
           $(this).find(":input").each(function( index ) {
            if($(this).attr("data")){
                p[$(this).attr("data")]=$(this).val()
            }
           });
           $this.posts.push(p)
        });
        this.post_form()
    }

    post_form(){
        var $this=this
        console.log(field_data_post_url)
        $.ajax({
            url: field_data_post_url,
            data:JSON.stringify({"data":this.posts}),
            crossDomain: true,
            //dataType: 'jsonp',
            type: "POST",
            success: function(d){
               //show your success
               console.log(d)
               $("#data_form_save_but").prop("disabled",false);
                 $("#data_form_save_but").removeClass("progress-bar progress-bar-striped progress-bar-animated");
                 // append data to the group
                 var _id=$this.posts[0]["id"];
                 if (typeof($this.grouped_data[_id])=="undefined"){
                    $this.grouped_data[_id]=[]
                 }
                 for(var i=0;i<$this.posts.length;i++){
                     $this.grouped_data[_id].push($this.posts[i])
                }
                // append the data to the marker
                map_manager.highlight_marker(_id)
                //todo  if for m is visible
                 $this.show_form(_id)
            },
            error: function(x,y,z){
                //show your error message
                console.log("Error",x,y,z)
           }
        });
    }

     format_date(date) {
      let datePart = [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate()
      ].map((n, i) => n.toString().padStart(i === 2 ? 4 : 2, "0")).join("-");
      let timePart = [
        date.getHours(),
        date.getMinutes(),
        date.getSeconds()
      ].map((n, i) => n.toString().padStart(2, "0")).join(":");
      return datePart + " " + timePart;
    }
 }