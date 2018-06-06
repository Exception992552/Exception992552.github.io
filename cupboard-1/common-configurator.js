"use strict"

// register the application module
b4w.register("my_project_test_main", function(exports, require) {

// import modules used by the app
var m_app       = require("app");
var m_cont      = require("container");
var m_cam       = require("camera");
var m_cfg       = require("config");
var m_data      = require("data");
var m_scenes    = require("scenes");
var m_trans     = require("transform");
var m_util      = require("util");
var m_version   = require("version");
var m_mouse     = require("mouse");
var m_scenes    = require("scenes");
var m_anim      = require("animation");
var m_preloader = require("preloader");
var m_obj       = require("objects");
var m_phy       = require("physics");
var m_vec3      = require("vec3");

// detect application mode
var DEBUG = (m_version.type() == "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = "assets/";
var _vec3_tmp = new Float32Array(3);
var _obj_delta_xy = new Float32Array(2);
var spawner_pos = new Float32Array(3);
var _vec3_tmp = new Float32Array(3);
var _vec3_tmp2 = new Float32Array(3);
var _vec3_tmp3 = new Float32Array(3);
var _vec4_tmp = new Float32Array(4);


var _prev_mouse_x = 0;
var _prev_mouse_y = 0;

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
    xobj.open('GET', 'assets/info.json', true); // Replace 'my_data' with the path to your file
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
exports.init = function() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        show_fps: DEBUG,
        console_verbose: DEBUG,
        autoresize: true
    });
}

/**
 * callback executed when the app is initialized 
 */
function init_cb(canvas_elem, success) {

    if (!success) {
        console.log("b4w init failure");
        return;
    }

    m_preloader.create_preloader();
     canvas_elem.addEventListener("mousedown", main_canvas_down);
    canvas_elem.addEventListener("touchstart", main_canvas_down);

    // ignore right-click on the canvas element
    canvas_elem.oncontextmenu = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return false;
    };
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


     
      
}

/**
 * load the scene data
 */
function load() {
    m_data.load(APP_ASSETS_PATH + "my_project.json", load_cb, preloader_cb);
    init_interface(); 
}


function load_cb(data_id, success) {   
    // m_app.enable_camera_controls();
     m_app.enable_camera_controls(false, false, false, null, true);
    // console.log("success: ", success)
}

function is_ie11() {
    return !(window.ActiveXObject) && "ActiveXObject" in window;
}



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
     document.getElementById("load-1").addEventListener("click", function(e) {
        m_data.load("assets/cupboard-2.json", null, null, true);
    });

     document.getElementById("delete").addEventListener("click", function(e) {
        if (_selected_obj) {
            
            var id = m_scenes.get_object_data_id(_selected_obj);
            m_data.unload(id);
            _selected_obj = null;
        }
    })

    init_buttons();
     
     

     function init_buttons() {
    var ids = ["delete"];

    for (var i = 0; i < ids.length; i++) {
        var id = ids[i];

        document.getElementById(id).addEventListener("mousedown", function(e) {
            var parent = e.target.parentNode;
            parent.classList.add("active");
        });
        document.getElementById(id).addEventListener("mouseup", function(e) {
            var parent = e.target.parentNode;
            parent.classList.remove("active");
        });
        document.getElementById(id).addEventListener("touchstart", function(e) {
            var parent = e.target.parentNode;
            parent.classList.add("active");
        });
        document.getElementById(id).addEventListener("touchend", function(e) {
            var parent = e.target.parentNode;
            parent.classList.remove("active");
        });
    }
}


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
		if(_current_model == null){
			_current_model = m_data.load(_file_names[this.id], loaded_cb, null, true);		
		}else{
			m_data.unload(_current_model);
			_current_model = m_data.load(_file_names[this.id], loaded_cb, null, true);
		}
         var description_text = document.getElementById("description_text");
        description_text.textContent = _btn_description[this.id]
	}
}
/**
 * update the app's preloader
 */
function preloader_cb(percentage) {
    m_preloader.update_preloader(percentage);
}
function main_canvas_down(e) {
    _drag_mode = true;

    if (e.preventDefault)
        e.preventDefault();

    var x = m_mouse.get_coords_x(e);
    var y = m_mouse.get_coords_y(e);

    var obj = m_scenes.pick_object(x, y);

    //handling outline effect
    if (_selected_obj != obj) {
        if (_selected_obj)
            m_scenes.clear_outline_anim(_selected_obj);
        if (obj)
            m_scenes.apply_outline_anim(obj, 1, 1, 0);

      _selected_obj = obj;
    }


    

    // calculate delta in viewport coordinates
    if (_selected_obj) {
        var cam = m_scenes.get_active_camera();

        var obj_parent = m_obj.get_parent(_selected_obj);
        if (obj_parent && m_obj.is_armature(obj_parent))
           
            m_trans.get_translation(obj_parent, _vec3_tmp);
        else
            m_trans.get_translation(_selected_obj, _vec3_tmp);
        m_cam.project_point(cam, _vec3_tmp, _obj_delta_xy);

        _obj_delta_xy[0] = x - _obj_delta_xy[0];
        _obj_delta_xy[1] = y - _obj_delta_xy[1];
    }
}



});

// import the app module and start the app by calling the init method
b4w.require("my_project_test_main").init();
