"use strict"

// register the application module
var _controlled_bone = null;

var _drag_mode = false;
var _selected_obj = null;

var _data_folder = "assets/";
var _data_format = ".json";
var _current_model = null;
var _file_names = [];
var _btn_names = [];
var _help_info = null;
var _help_trigger = 0;
var _btn_show_trigger = [];
var _btn_description = [];

var _lst_loaded_models = [];
function loadJSON(callback) {   

    var xobj = new XMLHttpRequest();
        // xobj.overrideMimeType("application/json");
    xobj.open('GET', 'assets/info1.json', true); // Replace 'my_data' with the path to your file
    xobj.onreadystatechange = function () {
          if (xobj.readyState == 4 && xobj.status == "200") {
            callback(xobj.response);
          }
    };
    xobj.send(null);
     
 
 }





/**
 * export the method to initialize the app (called at the bottom of this file)
 */



            loadJSON(function(response) {
    // Parse JSON string into object
        var actual_JSON = JSON.parse(response);
        for(var i = 0; i < actual_JSON.data.length;i++){
            _file_names.push(_data_folder + actual_JSON.data[i].name_file);
            _btn_names.push(actual_JSON.data[i].name_btn)
            _btn_show_trigger.push(actual_JSON.data[i].show_trigger)
            _btn_description.push(actual_JSON.data[i].descr)
            console.log(_btn_show_trigger);
        } 
           load();
     });


     


/**
 * load the scene data
 */

    init_interface(); 

var id_button = 0;
function init_interface(){
    var controls_container = document.getElementById("buttons_container");
 
    for(var i = 0; i < _file_names.length; i++){
        if (_btn_show_trigger[id_button] == 1){
        	var tempButton = create_button();
    	    tempButton.onclick = button_index;
            controls_container.append(tempButton);
        }
        id_button = id_button + 1;
    }
    //  document.getElementById("load-1").addEventListener("click", function(e) {
    //     m_data.load("assets/Table-1.json", null, null, true);
    // });

    //  document.getElementById("delete").addEventListener("click", function(e) {
    //     if (_selected_obj) {
            
    //         var id = m_scenes.get_object_data_id(_selected_obj);
    //         m_data.unload(id);
    //         _selected_obj = null;
    //     }
    // })
    //     document.getElementById("inherit").addEventListener("click", function(e) {
    //     if (_selected_obj) {
            
    //         var id = m_scenes.get_object_data_id(_selected_obj);
    //         // var cube = m_scenes.get_all_objects("Cube.001",2);
    //         // m_mat.inherit_material(cube, "Material", id, "MyMaterial.001");
           
    //     }
    // })

    init_buttons();
     
     

//      function init_buttons() {
//     var ids = ["delete"];

//     for (var i = 0; i < ids.length; i++) {
//         var id = ids[i];

//         document.getElementById(id).addEventListener("mousedown", function(e) {
//             var parent = e.target.parentNode;
//             parent.classList.add("active");
//         });
//         document.getElementById(id).addEventListener("mouseup", function(e) {
//             var parent = e.target.parentNode;
//             parent.classList.remove("active");
//         });
//         document.getElementById(id).addEventListener("touchstart", function(e) {
//             var parent = e.target.parentNode;
//             parent.classList.add("active");
//         });
//         document.getElementById(id).addEventListener("touchend", function(e) {
//             var parent = e.target.parentNode;
//             parent.classList.remove("active");
//         });
//     }
// }


}


function create_button(){
    var button = document.createElement("div");
    button.id = id_button;
    button.className = "button_container";

    var label = document.createElement("label");
    label.className = "text";
    label.textContent = _btn_names[id_button]
    button.appendChild(label);
    return button;
}

function stageload_cb(percentage, load_time){
}

function load_cb1(data_id, success){

}

var _file_loaded = true;
function button_index() {
	var loaded_cb = function(data_id, success){
		_file_loaded = true;
	}
	if(_file_loaded){
		_file_loaded = false;
		if(_current_model == null && _file_names[this.id]){
			_current_model = m_data.load(_file_names[this.id], loaded_cb, null, true);		
		}else{
			m_data.unload(_current_model);
			_current_model = m_data.load(_file_names[this.id], loaded_cb, null, true);
		}
	}
}
/**
 * update the app's preloader
 */
// function preloader_cb(percentage) {
//     m_preloader.update_preloader(percentage);
// }
// function main_canvas_down(e) {
//     _drag_mode = true;

//     if (e.preventDefault)
//         e.preventDefault();

//     var x = m_mouse.get_coords_x(e);
//     var y = m_mouse.get_coords_y(e);

//     var obj = m_scenes.pick_object(x, y);

//     //handling outline effect
//     if (_selected_obj != obj) {
//         if (_selected_obj)
//             m_scenes.clear_outline_anim(_selected_obj);
//         if (obj)
//             m_scenes.apply_outline_anim(obj, 1, 1, 0);

//       _selected_obj = obj;
//     }
// ///////////////////////////////////////////////
//     if (_selected_obj) {

  

//     }
    

//     // calculate delta in viewport coordinates
//     if (_selected_obj) {
//         var cam = m_scenes.get_active_camera();

//         var obj_parent = m_obj.get_parent(_selected_obj);
//         if (obj_parent && m_obj.is_armature(obj_parent))
           
//             m_trans.get_translation(obj_parent, _vec3_tmp);
//         else
//             m_trans.get_translation(_selected_obj, _vec3_tmp);
//         m_cam.project_point(cam, _vec3_tmp, _obj_delta_xy);

//         _obj_delta_xy[0] = x - _obj_delta_xy[0];
//         _obj_delta_xy[1] = y - _obj_delta_xy[1];
//     }
// }



// });

// import the app module and start the app by calling the init method
b4w.require("my_project_test_main").init();
