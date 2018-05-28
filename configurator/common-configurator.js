$(".toggle-table").stop().click(function() {
$(".toggle-block-table").slideToggle('slow');
$(".toggle-block-cupboard").slideUp('slow');
$(".toggle-block-cupboard-2").slideUp('slow');
});



$(".toggle-cupboard").click(function() {
$(".toggle-block-cupboard").slideToggle('slow');
$(".toggle-block-table").slideUp('slow');
$(".toggle-block-cupboard-2").slideUp('slow');
});

$(".toggle-window").click(function() {
$(".toggle-block-window").slideToggle('slow');
});


$(".toggle-cupboard-2").click(function() {
$(".toggle-block-cupboard-2").slideToggle('slow');
$(".toggle-block-cupboard").slideUp('slow');
$(".toggle-block-table").slideUp('slow');
});

$(".toggle-doors").click(function() {
$(".toggle-block-doors").slideToggle('slow');
});

"use strict"
// register the application module
b4w.register("my_project_main", function(exports, require) {

// import modules used by the app
var m_app       = require("app");
var m_cfg       = require("config");
var m_data      = require("data");
var m_preloader = require("preloader");
var m_ver       = require("version");

var m_cam       = require("camera");
var m_cont      = require("container");
var m_ctl       = require("controls");
var m_mouse     = require("mouse");
var m_math      = require("math");
var m_obj       = require("objects");
var m_phy       = require("physics");
var m_preloader = require("preloader");
var m_scenes    = require("scenes");
var m_trans     = require("transform");
var m_util      = require("util");
var m_vec3    	= require("vec3");
var m_time    	= require("time");
var m_quat 		= require("quat");
var cam_anim    = require("camera_anim");


var ANIM_TIME = 2;

var _anim_stop = false;
var _delta_target = ANIM_TIME;
var _cam_anim = {
    timeline: -ANIM_TIME,
    starting_eye: new Float32Array(3),
    starting_target: new Float32Array(3),
    final_eye: new Float32Array(3),
    final_target: new Float32Array(3),
    current_eye: new Float32Array(3),
    current_target: new Float32Array(3)
}

var _vec3_tmp = new Float32Array(3);

var _file_names = [];
var _btn_show_trigger = []

var OUTLINE_COLOR_VALID = [0, 1, 0];
var OUTLINE_COLOR_ERROR = [1, 0, 0];
var FLOOR_PLANE_NORMAL = [0, 1, 0];

var ROT_ANGLE = 2/Math.PI;

var WALL_X_MAX = 4;
var WALL_X_MIN = -3.8;
var WALL_Z_MAX = 4.2;
var WALL_Z_MIN = -3.5;

var _obj_delta_xy = new Float32Array(2);
var spawner_pos = new Float32Array(3);
var _vec3_tmp = new Float32Array(3);
var _vec3_tmp2 = new Float32Array(3);
var _vec3_tmp3 = new Float32Array(3);
var _vec4_tmp = new Float32Array(4);
var _pline_tmp = m_math.create_pline();

var _drag_mode = false;
var _enable_camera_controls = true;

var _selected_obj = null;
var _current_model = null;
// detect application mode
var DEBUG = (m_ver.type() == "DEBUG");

// automatically detect assets path
var APP_ASSETS_PATH = "assets/";


/**
 * export the method to initialize the app (called at the bottom of this file)
 */
exports.init = function() {
    m_app.init({
        canvas_container_id: "main_canvas_container",
        callback: init_cb,
        physics_enabled: true,
        alpha: false,
        background_color: [1.0, 1.0, 1.0, 0.0],
        show_fps: DEBUG,
        assets_dds_available: !DEBUG,
        assets_min50_available: !DEBUG,
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

    window.onresize = m_cont.resize_to_container;
    m_cont.resize_to_container();
    load();
}


/**
 * update the app's preloader
 */
function preloader_cb(percentage) {
    m_preloader.update_preloader(percentage);
}


/**
 * load the scene data
 */
function load() {
    m_data.load(APP_ASSETS_PATH + "my_project.json", load_cb, preloader_cb);

}

/**
 * callback executed when the scene data is loaded
 */
function load_cb(data_id) {
    // place your code here


    // m_app.enable_camera_controls(false, false, false, m_cont.get_canvas()); ПРЕДЫДУЩИЙ
    m_app.enable_camera_controls(false, false, false, null, true);
    var camobj = m_scenes.get_active_camera();
    init_camera_animation(camobj);

    init_controls(); 
}

function start_camera_animation(camobj, pos_view, pos_target) {
    // retrieve camera current position
    m_cam.target_get_pivot(camobj, _cam_anim.current_target);
    m_trans.get_translation(camobj, _cam_anim.current_eye);

    // set camera starting position
    m_vec3.copy(_cam_anim.current_target, _cam_anim.starting_target);
    m_vec3.copy(_cam_anim.current_eye, _cam_anim.starting_eye);

    // set camera final position
    m_vec3.copy(pos_view, _cam_anim.final_eye);
    m_vec3.copy(pos_target, _cam_anim.final_target);

    // start animation
    _delta_target = ANIM_TIME;
    _cam_anim.timeline = m_time.get_timeline();
}

function init_camera_animation(camobj) {

    var t_sensor = m_ctl.create_timeline_sensor();
    var e_sensor = m_ctl.create_elapsed_sensor();

    var logic_func = function(s) {
       
        return s[0] - _cam_anim.timeline < ANIM_TIME;
    }

    var cam_move_cb = function(camobj, id, pulse) {

        if (pulse == 1) {
            if (_anim_stop) {
                _cam_anim.timeline = -ANIM_TIME;
                return;
            }

            m_app.disable_camera_controls();

            // elapsed = frame time (e_sensor value)
            var elapsed = m_ctl.get_sensor_value(camobj, id, 1);
            var delta = elapsed / ANIM_TIME;

            m_vec3.subtract(_cam_anim.final_eye, _cam_anim.starting_eye, _vec3_tmp);
            m_vec3.scaleAndAdd(_cam_anim.current_eye, _vec3_tmp, delta, _cam_anim.current_eye);

            _delta_target -= elapsed;
            delta = 1 - _delta_target * _delta_target / (ANIM_TIME * ANIM_TIME);
            m_vec3.subtract(_cam_anim.final_target, _cam_anim.starting_target, _vec3_tmp);
            m_vec3.scaleAndAdd(_cam_anim.starting_target, _vec3_tmp, delta, _cam_anim.current_target);

            m_cam.target_set_trans_pivot(camobj, _cam_anim.current_eye, _cam_anim.current_target);

        } else {
            m_app.enable_camera_controls(false, false, false, null, true);
            if (!_anim_stop)
                m_cam.target_set_trans_pivot(camobj, _cam_anim.final_eye, 
                        _cam_anim.final_target);
            else
                _anim_stop = false;
        }
    }

    m_ctl.create_sensor_manifold(camobj, "CAMERA_MOVE", m_ctl.CT_CONTINUOUS,
            [t_sensor, e_sensor], logic_func, cam_move_cb);
}

function init_controls() {
    var controls_elem = document.getElementById("controls-container");
    controls_elem.style.display = "block";

     init_buttons();
 }

     document.getElementById("load-1").addEventListener("click", function(e) {
        m_data.load("assets/Table-1.json", loaded_cb, null, null, true);
    });
      document.getElementById("load-2").addEventListener("click", function(e) {
        m_data.load("assets/item-1json.json", loaded_cb, null, null, true);
    });
     document.getElementById("load-3").addEventListener("click", function(e) {
        m_data.load("assets/item-2.json", loaded_cb, null, null, true);
    });
       document.getElementById("load-three").addEventListener("click", function(e) {
        m_data.load("assets/item-3.json", loaded_cb, null, null, true);
    });
     document.getElementById("load-four").addEventListener("click", function(e) {
        m_data.load("assets/item-4.json", loaded_cb, null, null, true);
    });
    document.getElementById("load-five").addEventListener("click", function(e) {
        m_data.load("assets/item-5.json", loaded_cb, null, null, true);
    });

    document.getElementById("load-4").addEventListener("click", function(e) {
        m_data.load("assets/cupboard-1.json", loaded_cb, null, null, true);
    });

     document.getElementById("load-5").addEventListener("click", function(e) {
        m_data.load("assets/mini-windows-2.json", loaded_cb, null, null, true);
       
      
    });
    document.getElementById("load-6").addEventListener("click", function(e) {
        m_data.load("assets/mini-windows-1.json", loaded_cb, null, null, true);
         
    });
      document.getElementById("load-7").addEventListener("click", function(e) {
        m_data.load("assets/mini-doors-1.json", loaded_cb, null, null, true);
    });
        document.getElementById("load-8").addEventListener("click", function(e) {
        m_data.load("assets/mini-doors-2.json", loaded_cb, null, null, true);
    });
        document.getElementById("load-9").addEventListener("click", function(e) {
        m_data.load("assets/shelf-1.json", loaded_cb, null, null, true);
    });
         document.getElementById("load-10").addEventListener("click", function(e) {
        m_data.load("assets/shelf-2.json", loaded_cb, null, null, true);
    });



    document.getElementById("load-20").addEventListener("click", function(e) {
    m_data.load("assets/cupboard-2.json", loaded_cb, null, null, true);
    m_data.load("assets/aside-1.json", loaded_cb, null, null, true);
    m_data.load("assets/aside-2.json", loaded_cb, null, null, true);
    });
     document.getElementById("load-21").addEventListener("click", function(e) {
    m_data.load("assets/cupboard-2.json", loaded_cb, null, null, true);
    });

    document.getElementById("load-22").addEventListener("click", function(e) {
    m_data.load("assets/left-aside.json", loaded_cb, null, null, true);
    });
    document.getElementById("load-23").addEventListener("click", function(e) {
    m_data.load("assets/right-aside.json", loaded_cb, null, null, true);
    });


     document.getElementById("delete").addEventListener("click", function(e) {
        if (_selected_obj) {
            
            var id = m_scenes.get_object_data_id(_selected_obj);
            m_data.unload(id);
            _selected_obj = null;
        }
    });

function init_buttons() {
    var ids = ["delete"]; //"rot-ccw", "rot-cw"];

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

function loaded_cb(data_id) {

    var objs = m_scenes.get_all_objects("ALL", data_id);
    for (var i = 0; i < objs.length; i++) {
        var obj = objs[i];

         var target = obj;
         var eye = m_scenes.get_object_by_name("Camera");

    if (eye && target) {
        var camobj = m_scenes.get_active_camera();
        var pos_view = m_trans.get_translation(eye);
        var pos_target = m_trans.get_translation(target);
        start_camera_animation(camobj, pos_view, pos_target);
    }

	var anim_id = m_time.animate(m_cam.get_fov(camobj), 0.5, 2000, function(val){
        m_cam.set_fov(camobj, val);
    });
     m_time.clear_animation(anim_id);
     anim_id = m_time.animate(m_cam.get_fov(camobj), 0.5, 2000, function(val){
     m_cam.set_fov(camobj, val);
        });


       
                m_scenes.show_object(obj);
        

        // if (m_obj.is_mesh(obj)) {
        //     _current_model = m_scenes.show_object(obj);
        // } 
            // m_scenes.show_object(obj);
        

            // _file_loaded = true; 
  
      
       

    }}
     
    
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
            // get translation from the parent (armature) of the animated object
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
b4w.require("my_project_main").init();