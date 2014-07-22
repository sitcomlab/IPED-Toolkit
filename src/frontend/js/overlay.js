/*!
* The iPED Toolkit
* Overlays
*
* (c) 2014 Morin Ostkamp
* Institute for Geoinformatics (ifgi), University of Münster
*/

define(['threejs/js/three.min',
        'threejs/js/Detector',
        'threejs/js/CSS3DRenderer',
        'threejs/js/TransformControls',
        'underscorejs/js/underscore'],
        
        function(THREE, Detector, CSS3DRenderer, TransformControls, Underscore) {
    
          /**
           * Overlays can be placed on top of a video to create the illusion of 3D objects that are blended into the simulation, e.g., public displays.
           * @constructor
           */
          function Overlay(parent, jqueryElement) {
            this.parent = parent;
          	this.jqueryElement = jqueryElement;
          	this.camera = '';
          	this.gridhelper = '';
          	this.scene = '';
          	this.cssScene = '';
          	this.renderer = '';
          	this.cssRenderer = '';
          	this.videos = new Array();
          	this.videoTextures = new Array();
          	this.showUI = true;
          	this.controls = new Array();
            
            _.bindAll(this, 'render', 'onKeyDown', 'onWindowResize', 'createOverlays');

          	this.initHooks();
          	this.init();
          	this.render();
          }

          /**
          * Hooks the Overlay plugin to the frontend's functions
          */
          Overlay.prototype.initHooks = function() {
          	$.aop.after({target: this.parent, method: 'setLocationId'}, this.createOverlays);
          };

          /**
          * Initializes the Overlay plugin
          */
          Overlay.prototype.init = function() {
          	this.jqueryElement.css('position', 'absolute');
          	this.jqueryElement.css('top', '0px');

          	this.cssRenderer = new THREE.CSS3DRenderer({antialias: true, alpha: true});
          	this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
          	this.cssRenderer.domElement.style.position = 'absolute';
          	this.jqueryElement.append(this.cssRenderer.domElement);

          	if (Detector.webgl) {
          		this.renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
          	} else {
          		this.renderer = new THREE.CanvasRenderer(); 
          	}
          	this.renderer.setSize(window.innerWidth, window.innerHeight);
          	this.renderer.domElement.style.position = 'absolute';
          	this.jqueryElement.append(this.renderer.domElement);

          	this.cssScene = new THREE.Scene();
          	this.scene = new THREE.Scene();
          	this.gridhelper = new THREE.GridHelper(500, 100);
          	this.gridhelper.setColors('#000000', '#000000')
          	this.scene.add(this.gridhelper);

          	this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 3000);
          	this.camera.position.set(0, 101, 300);
          	this.camera.lookAt(new THREE.Vector3(0, 101, 0));

          	var light = new THREE.AmbientLight(0xffffff);
          	light.position.set(1, 1, 1);
          	this.scene.add(light);

          	window.addEventListener('resize', this.onWindowResize);
          	window.addEventListener('keydown', this.onKeyDown);
          };
    
          /**
          * 
          */
          Overlay.prototype.createOverlays = function(id) {
            var overlays = [];

            $.ajax({
              'async' : false,
              'url' : SERVER_URL+ PORT + 'api/locations/' + id,
              'dataType' : 'json',
              'beforeSend' : function(request) {},
              'success' : function(data) {

                data.overlays.forEach(function(overlayId) {
                  $.ajax({
                    'async' : false,
                    'url' : SERVER_URL+ PORT + 'api/overlays/' + overlayId,
                    'dataType' : 'json',
                    'beforeSend' : function(request) {},
                    'success' : function(data) {
                      overlays.push(data);
                    },
                    'error' : function(jqXHR, textStatus, errorThrown) {
                      alert('' + errorThrown);
                    }
                  });
                }, this);
  
              },
              'error' : function(jqXHR, textStatus, errorThrown) {
                alert('' + errorThrown);
              }
            });

          	if (overlays == null || overlays == "undefined") {
          		console.log("There are no overlays at this location.");
          	} else {
          		console.log("There are " + overlays.length + " overlays at this location.");
          		overlays.forEach(function(display) {
          			var object;

          			switch(display.type) {
          				case 'html':
          					var element = document.createElement('iframe');
          					element.src = display.url;
          					element.style.width = display.w + 'px';
          					element.style.height = display.h + 'px';
          					element.style.border = '0px';

          					object = new THREE.CSS3DObject(element);
          					this.cssScene.add(object);
          					break;

		
          				case 'video':
          					var n = this.videos.push(document.createElement('video')) - 1;
          					this.jqueryElement[0].appendChild(this.videos[n]);
		
          					var mp4Source = document.createElement('source');
          					mp4Source.src = display.url + '.mp4';
          					mp4Source.type = 'video/mp4';
          					this.videos[n].appendChild(mp4Source);

          					var ogvSource = document.createElement('source');
          					ogvSource.src = display.url + '.ogv';
          					ogvSource.type = 'video/ogv';
          					this.videos[n].appendChild(ogvSource);
		
          					this.videos[n].autoplay = 'autoplay';
          					this.videos[n].loop = 'loop';
          					this.videos[n].style.display = 'none';

          					if (this.videos[n]) {
          						var m = this.videoTextures.push(new THREE.Texture(this.videos[n])) - 1;
          						var material = new THREE.MeshLambertMaterial({
          					 	 map : this.videoTextures[m]
          						});
          						this.videos[n].play(); // Make sure the video plays
          					}
		
          					var geometry = new THREE.BoxGeometry(display.w, display.h, display.d);
          					object = new THREE.Mesh(geometry, material);
          					this.scene.add(object);
          					break;

		
          				case 'image':
          					var texture = THREE.ImageUtils.loadTexture(display.url, new THREE.UVMapping(), render);
          					texture.anisotropy = this.renderer.getMaxAnisotropy();
          					var material = new THREE.MeshLambertMaterial({map: texture});

          					var geometry = new THREE.BoxGeometry(display.w, display.h, display.d);
          					object = new THREE.Mesh(geometry, material);
          					this.scene.add(object);
          					break;

		
          				default:
          					var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
          					var geometry = new THREE.BoxGeometry(display.w, display.h, display.d);
          					object = new THREE.Mesh(geometry, material);
          					this.scene.add(object);
          					break;
          			}

          			object.position.x = display.x;
          			object.position.y = display.y;
          			object.position.z = display.z;
          			object.rotation.x = display.rx;
          			object.rotation.y = display.ry;
          			object.rotation.z = display.rz;
          			object.scale.x = 0.25; //FIXME: This is a magic number without meaning
          			object.scale.y = 0.25; //FIXME: This is a magic number without meaning

          			var n = this.controls.push(new THREE.TransformControls(this.camera, this.renderer.domElement)) - 1;
          			this.controls[n].addEventListener('change', this.render);
          			this.controls[n].attach(object);
          			this.scene.add(this.controls[n]);
          		}, this);
          	}
          };

          Overlay.prototype.onKeyDown = function(event) {
            //console.log(event.which);
            switch (event.keyCode) {
              case 81: // Q
          			this.controls.forEach(function(control) {
          				control.setSpace(control.space == "local" ? "world" : "local");
          			}, this);
                break;
              case 87: // W
          			this.controls.forEach(function(control) {
          				control.setMode("translate");
          			}, this);
                break;
              case 69: // E
          			this.controls.forEach(function(control) {
          				control.setMode("rotate");
          			}, this);
                break;
              case 82: // R
          			this.controls.forEach(function(control) {
          				control.setMode("scale");
          			}, this);
                break;
          		case 187:
          		case 107: // +,=,num+
          			this.controls.forEach(function(control) {
          				control.setSize(control.size + 0.1);
          			}, this);
          			break;
          		case 189:
          		case 10: // -,_,num-
          			this.controls.forEach(function(control) {
          				control.setSize(Math.max(control.size - 0.1, 0.1 ));
          			}, this);
          			break;
          		case 73: //I
          			if (this.showUI == true) {
          				this.controls.forEach(function(control) {
          					this.scene.remove(control);
          				}, this);
          				this.scene.remove(this.gridhelper);
          				this.cssRenderer.domElement.style.zIndex = '9999';
          				this.showUI = false;
          			} else {
          				this.controls.forEach(function(control) {
          					this.scene.add(control);
          				}, this);
          				this.scene.add(this.gridhelper);
          				this.cssRenderer.domElement.style.zIndex = '0';
          				this.showUI = true;
          			}
          			this.render();
          			break;
            }
          };

          Overlay.prototype.onWindowResize = function() {
          	if (this.camera) {
          		this.camera.aspect = window.innerWidth / window.innerHeight;
          		this.camera.updateProjectionMatrix();
          	}

          	if (this.cssRenderer) {
          		this.cssRenderer.setSize(window.innerWidth, window.innerHeight);
          	}
          	if (this.renderer) {
          		this.renderer.setSize(window.innerWidth, window.innerHeight);	
          	}

          	if (this.render) {
          		this.render();
          	}
          };

          Overlay.prototype.render = function() {
            requestAnimationFrame(this.render);
          	if (this.videos) {
          		var i = 0;
          		this.videos.forEach(function(video) {
          			if (video && video.readyState === video.HAVE_ENOUGH_DATA){
          			  this.videoTextures[i].needsUpdate = true;
          			}
          			i++;
          		}, this);
          	}

          	if (this.controls) {
          		this.controls.forEach(function(control) {
          			control.update();
          		});
          	}

          	if (this.cssRenderer) {
          		this.cssRenderer.render(this.cssScene, this.camera);
          	}

          	if (this.renderer) {
          		this.renderer.render(this.scene, this.camera);
          	}
          };
    
          return Overlay;
        }
);
