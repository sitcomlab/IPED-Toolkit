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
        'underscorejs/js/underscore',
        'aop/js/meld'],
        
        function(THREE, Detector, CSS3DRenderer, TransformControls, Underscore, Meld) {
          
          /**
          * The Backbone.js model of a location
          */
          Location = Backbone.Model.extend({
            urlRoot: SERVER_URL + PORT + 'api/locations',
            initialize: function() {
              _.bindAll(this, 'fetch');
            }
          });
          
          /**
          * The Backbone.js model of an overlay
          */
          Overlay = Backbone.Model.extend({
            urlRoot: SERVER_URL + PORT + 'api/overlays',
            initialize: function() {
              _.bindAll(this, 'fetch');
            }
          });
          
          /**
          * The Backbone.js collection of overlays
          */
          Overlays = Backbone.Collection.extend({
            model: Overlay
          });
    
          /**
           * Overlays can be placed on top of a video to create the illusion of 3D objects that are blended into the simulation, e.g., public displays.
           * @constructor
           */
          function OverlayPlugin(opts) {
            JL('iPED Toolkit.OverlayPlugin').info('OverlayPlugin loaded');
            
            this.parent = opts.parent; // FIXME: Include type check, e.g., $.typeof(opts.parent) === 'frontend'
          	this.jqueryElement = opts.jqueryElement;
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
            this.overlays = null;
            
            _.bindAll(this, 'render', 'onKeyDown', 'onWindowResize', 'createOverlays');

          	this.init();
            this.createOverlays();
          	this.render();
          }

          /**
          * Initializes the Overlay plugin
          */
          OverlayPlugin.prototype.init = function() {
            // Hooks the Overlay plugin to the frontend's functions
            // Morin: This could also be done by using Backbone.js's on change listener
            Meld.after(this.parent, 'setLocationId', this.createOverlays);
            
            // Make sure that Three.js uses CORS to load external urls as textures, for example.
            THREE.ImageUtils.crossOrigin = '';
            
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
          * Creates an Three.js object for each overlay
          */
          OverlayPlugin.prototype.createOverlays = function() {
            thiz = this;
            
            this.overlays = new Overlays();
            this.overlays.url = SERVER_URL + PORT + 'api/locations/' + this.parent.location.get('id') + '/overlays';
            this.overlays.fetch({
              success: function(model, response, options) {                
              	if (!thiz.overlays || thiz.overlays.length == 0) {
              		JL('iPED Toolkit.OverlayPlugin').info('There are no overlays at this location');
              	} else {
                  JL('iPED Toolkit.OverlayPlugin').info('There are ' + thiz.overlays.length + ' overlays at this location');
                  JL('iPED Toolkit.OverlayPlugin').debug(thiz.overlays);
              		thiz.overlays.each(function(overlay) {
                    var object;
              			switch(overlay.get('type')) {
              				case 'html':
              					var element = document.createElement('iframe');
              					element.src = overlay.get('url');
              					element.style.width = overlay.get('w') + 'px';
              					element.style.height = overlay.get('h') + 'px';
              					element.style.border = '0px';

              					object = new THREE.CSS3DObject(element);
              					thiz.cssScene.add(object);
              					break;

		
              				case 'video':
              					var n = thiz.videos.push(document.createElement('video')) - 1;
              					thiz.jqueryElement[0].appendChild(thiz.videos[n]);
		
              					var mp4Source = document.createElement('source');
              					mp4Source.src = overlay.get('url') + '.mp4';
              					mp4Source.type = 'video/mp4';
              					thiz.videos[n].appendChild(mp4Source);

              					var ogvSource = document.createElement('source');
              					ogvSource.src = overlay.get('url') + '.ogv';
              					ogvSource.type = 'video/ogv';
              					thiz.videos[n].appendChild(ogvSource);
		
              					thiz.videos[n].autoplay = 'autoplay';
              					thiz.videos[n].loop = 'loop';
              					thiz.videos[n].style.display = 'none';

              					if (thiz.videos[n]) {
              						var m = thiz.videoTextures.push(new THREE.Texture(thiz.videos[n])) - 1;
              						var material = new THREE.MeshLambertMaterial({
              					 	 map : thiz.videoTextures[m]
              						});
              						thiz.videos[n].play(); // Make sure the video plays
              					}
		
              					var geometry = new THREE.BoxGeometry(overlay.get('w'), overlay.get('h'), overlay.get('d'));
              					object = new THREE.Mesh(geometry, material);
              					thiz.scene.add(object);
              					break;

		
              				case 'image':
              					var texture = THREE.ImageUtils.loadTexture(overlay.get('url'), new THREE.UVMapping(), thiz.render);
              					texture.anisotropy = thiz.renderer.getMaxAnisotropy();
              					var material = new THREE.MeshLambertMaterial({map: texture});

              					var geometry = new THREE.BoxGeometry(overlay.get('w'), overlay.get('h'), overlay.get('d'));
              					object = new THREE.Mesh(geometry, material);
              					thiz.scene.add(object);
              					break;

		
              				default:
              					var material = new THREE.MeshBasicMaterial({color: 0xff0000, side: THREE.DoubleSide});
              					var geometry = new THREE.BoxGeometry(overlay.get('w'), overlay.get('h'), overlay.get('d'));
              					object = new THREE.Mesh(geometry, material);
              					thiz.scene.add(object);
              					break;
              			}

              			object.position.x = overlay.get('x');
              			object.position.y = overlay.get('y');
              			object.position.z = overlay.get('z');
              			object.rotation.x = overlay.get('rx');
              			object.rotation.y = overlay.get('ry');
              			object.rotation.z = overlay.get('rz');
              			object.scale.x = 0.25; //FIXME: This is a magic number without meaning
              			object.scale.y = 0.25; //FIXME: This is a magic number without meaning

              			var n = thiz.controls.push(new THREE.TransformControls(thiz.camera, thiz.renderer.domElement)) - 1;
              			thiz.controls[n].addEventListener('change', thiz.render);
              			thiz.controls[n].attach(object);
              			thiz.scene.add(thiz.controls[n]);
              		});
              	}
              },
              error: function(model, response, options) {
                JL('iPED Toolkit.OverlayPlugin').error(respone); 
              }
            });
          };

          /**
          * Handles key events, e.g., "toggle interactive mode (i)" or "disable chroma keying (k)".
          */
          OverlayPlugin.prototype.onKeyDown = function(event) {
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

          /**
          * Updates Three.js according to window resizing events.
          */
          OverlayPlugin.prototype.onWindowResize = function() {
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

          /**
          * Renders the Three.js scene. Is called by window.requestAnimationFrame().
          */
          OverlayPlugin.prototype.render = function() {
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
    
          return OverlayPlugin;
        }
);
