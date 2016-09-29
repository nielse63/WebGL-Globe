
// taken from: http://callumprentice.github.io/apps/flight_stream/
// https://freevectormaps.com/world-maps/WRLD-EPS-01-0001
(function(factory) {
	'use strict';

	var _c = window.Clique;

	if(document.querySelector('.globe') && _c.Browser.browser.name !== 'ie') {
		_c.getScripts(window.BLUE_MARBLE.scripts.homepage, function() {
			factory(_c);
		});
	} else {
		_c.$doc.on('pageready', function() {
			_c.$doc.trigger('globeready');
		});
	}
}(function(_c) {
	'use strict';

	var ifvisible = window.ifvisible;
	var THREE       = window.THREE;
	var ScrollMagic = window.ScrollMagic;

	// var timeout;
	var frameId;
	var globe = document.querySelector('.globe');
	var width;
	var height;
	var earth;
	var system;
	var scene;
	var camera;
	var renderer;
	var isInView = true;
	var earthRadius = 0.85;

	var flightPaths;
	var worker;
	var geometry = new THREE.BufferGeometry();
	var material = new THREE.LineBasicMaterial({
		color       : new THREE.Color('#364434'),
		transparent : true,
		opacity     : 0.15,
		depthTest   : true,
		depthWrite  : false,
		linewidth   : 2
	});
	// var flight_point_cloud_geom = new THREE.BufferGeometry();


	function addLighting() {
		var sun = new THREE.DirectionalLight(0xFFFFFF, 0.3);
		sun.name = 'sun';
		sun.position.set(0.8, 0.5, 0);
		sun.castShadow = true;
		sun.shadow.camera.near = 1;
		sun.shadow.camera.far = 5;
		sun.shadow.camera.fov = 30;
		sun.shadow.camera.left = -1;
		sun.shadow.camera.right = 1;
		sun.shadow.camera.top = 1;
		sun.shadow.camera.bottom = -1;
		sun.revolutionAngle = -Math.PI / 4;
		system.add(sun);
	}

	function createScene() {
		width  = globe.offsetWidth || window.innerWidth;
		height = globe.offsetHeight || window.innerHeight;

		renderer = new THREE.WebGLRenderer({
			// autoClear : true,
			// antialias : true,
			alpha     : true,
		});
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(
			width,
			height
		);
		renderer.setClearColor(new THREE.Color('#0a0b26'));

		scene             = new THREE.Scene();
		camera            = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
		camera.position.z = 1.5;

		globe.appendChild(renderer.domElement);
		system = new THREE.Object3D();
		system.name = 'system';
		scene.add(system);
	}

	function render() {
		renderer.render(scene, camera);
	}

	function animate() {
		if( ! isInView ) {
			return;
		}

		// rotate
		earth.rotation.y -= 0.0001;

		// render and run again
		render();
		frameId = requestAnimationFrame(animate);
	}

	function addEarth() {
		return new Promise(function(resolve) {
			var loader = new THREE.TextureLoader();
			loader.load(
				'/wp-content/themes/bluemarble/dist/images/earth_airports.png',
				function(map) {
					loader.load(
						'/wp-content/themes/bluemarble/dist/images/water.png',
						function(specularMap) {
							loader.load(
								'/wp-content/themes/bluemarble/dist/images/elevation.jpg',
								function(bumpMap) {

									// create earth
									earth = new THREE.Mesh(
										new THREE.SphereGeometry(earthRadius, 64, 64),
										new THREE.MeshPhongMaterial({
											map         : map,
											color       : new THREE.Color('#0D1546'),
											emissive    : new THREE.Color('#0a0b26'),
											specularMap : specularMap,
											bumpMap     : bumpMap,
											bumpScale   : 0.001,
											specular    : new THREE.Color('grey')
										})
									);
									earth.name = 'earth';
									earth.castShadow = true;
									earth.receiveShadow = false;
									earth.rotation.y += 0.2;
									earth.rotation.x += 0.5;
									system.add(earth);

									resolve();
								}
							);
						}
					);
				}
			);
		});
	}

	var addedPaths = false;

	function ready() {
		return new Promise(function(resolve) {
			createScene();
			addLighting();
			addEarth().then(function() {
				if( flightPaths && ! addedPaths ) {
					addedPaths = true;
					earth.add(flightPaths);
					animate();
				}

				setTimeout(function() {
					globe.classList.add('shown');
					resolve();
				}, 0);
			});
		});
	}

	function getFlights() {
		if( ! worker ) {
			worker = new Worker(window.BLUE_MARBLE.workers.globe);
			worker.onmessage = function(e) {

				// paths
				geometry.addAttribute('position', new THREE.BufferAttribute(e.data.paths.line_positions, 3));
				geometry.addAttribute('color', new THREE.BufferAttribute(e.data.paths.colors, 3));
				geometry.computeBoundingSphere();
				flightPaths = new THREE.Line(geometry, material, THREE.LineSegments);
				if(earth) {
					addedPaths = true;
					animate();
					earth.add(flightPaths);
				}

				// points
				// flight_point_cloud_geom.addAttribute('position', new THREE.BufferAttribute(e.data.points.positions, 3));
				// flight_point_cloud_geom.addAttribute('customColor', new THREE.BufferAttribute(e.data.points.colors, 3));
				// flight_point_cloud_geom.addAttribute('size', new THREE.BufferAttribute(e.data.points.sizes, 1));
				// flight_point_cloud_geom.computeBoundingBox();
				// new THREE.TextureLoader()
				// 	.load('/wp-content/themes/bluemarble/dist/images/point.png',
				// 	function(pointImage) {
				// 		var shaderMaterial = new THREE.ShaderMaterial({
				// 			uniforms: {
				// 				color: {
				// 					type: "c",
				// 					value: new THREE.Color(0xffffff)
				// 				},
				// 				texture: {
				// 					type: "t",
				// 					value: pointImage
				// 				}
				// 			},
				// 			// attributes: {
				// 			// 	size: {
				// 			// 		type: 'f',
				// 			// 		value: null
				// 			// 	},
				// 			// 	customColor: {
				// 			// 		type: 'c',
				// 			// 		value: null
				// 			// 	}
				// 			// },
				// 			vertexShader: document.getElementById('vertexshader').textContent,
				// 			fragmentShader: document.getElementById('fragmentshader').textContent,
				// 			blending: THREE.AdditiveBlending,
				// 			depthTest: true,
				// 			depthWrite: false,
				// 			transparent: true
				// 		});
				// 		var points = new THREE.Points(flight_point_cloud_geom, shaderMaterial);

				// 		if( earth ) {
				// 			addedPaths = true;
				// 			earth.add(points);
				// 			animate();
				// 		}
				// 	});
			};
		}

		// init worker
		worker.postMessage('go');
	}

	function onResizeEnd() {
		if( ! isInView || ! earth ) {
			return;
		}

		// update size vars
		width  = globe.offsetWidth || window.innerWidth;
		height = globe.offsetHeight || window.innerHeight;

		// set new canvas size
		renderer.setSize(width, height, true);

		// update the camera
		camera.aspect = width / height;
		camera.updateProjectionMatrix();
	}

	function initScrollListener() {
		// vars
		var target = document.querySelector('.banner-home');

		// create scene
		new ScrollMagic.Scene({
			triggerElement : target,
			triggerHook    : 'onLeave',
			duration       : target.clientHeight,
		})
		.on('enter', onFocusIn)
		.on('leave', onFocusOut)
		.addTo(_c.controller);
	}

	function onFocusIn() {
		isInView = true;
		if(frameId) {
			animate();
		}
		// render();
	}

	function onFocusOut() {
		isInView = false;
		cancelAnimationFrame(frameId);
	}

	// execute
	getFlights();
	_c.$('.animsition').on('animsition.inStart', function() {
		_c.$doc.trigger('globeready');
	});
	_c.$doc.on('pageready', function() {
		ready().then(function() {
			initScrollListener();
		});
	});
	_c.$win.on('resizeend', onResizeEnd);
	ifvisible
		.on('focus', onFocusIn)
		.on('wakeup', onFocusIn)
		.on('blur', onFocusOut)
		.on('idle', onFocusIn);
}));
