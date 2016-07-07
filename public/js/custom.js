// $(document).ready(function() {
	// var scene = new THREE.Scene(),
	//     numCubes = 0,
	//     controls,
	//     clock = new THREE.Clock();
	// var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 10000 );
	// camera.position.z = 1000;
	// camera.lookAt(scene.position);

	// var renderer = new THREE.WebGLRenderer();
	// renderer.setSize( window.innerWidth, window.innerHeight );
	// document.getElementById('app').appendChild( renderer.domElement );

	// controls = new THREE.FirstPersonControls( camera );
	// controls.movementSpeed = 100;
	// controls.lookSpeed = 0.1;
	
	// // var cube = new THREE.Mesh( geometry, material );
	// // scene.add( cube );

	// var socket = io.connect('http://localhost:1234');
 //    var self = this;

 //    socket.on('info', function (data) {
 //    	var tweetLength = data.tweet.text.length,
 //    		tweetColor  = data.tweet.user.profile_background_color;
 //    	// console.log("color: ", parseInt(tweetColor, 16));
 //    	var geometry = new THREE.BoxGeometry( tweetLength, tweetLength, tweetLength );
	// 	var material = new THREE.MeshBasicMaterial( { color: parseInt(tweetColor, 16) } );
 //        var cube = new THREE.Mesh( geometry, material );
 //        cube.position.x = Math.random() * 800 - 400;
 //        cube.position.y = Math.random() * 800 - 400;
 //        cube.position.z = numCubes * -10;
 //        scene.add( cube );
 //        numCubes++;
 //    });


 //    function animate() {
	// 	requestAnimationFrame( animate );
	// 	// displayNearest(camera.position);
	// 	controls.update( clock.getDelta() );
	// 	renderer.render( scene, camera );
	// }


	// var render = function () {
	// 	requestAnimationFrame( render );

	// 	// cube.rotation.x += 0.1;
	// 	// cube.rotation.y += 0.1;

	// 	renderer.render(scene, camera);
	// };



	// animate();
// });


var camera, scene, renderer;
var geometry, mesh,
	numCubes = 0;
var controls;
var objects = [];
var amountOfParticles = 500000, maxDistance = Math.pow(120, 2);
var positions, alphas, particles, _particleGeom;
var clock = new THREE.Clock();
var blocker = document.getElementById( 'blocker' );
var instructions = document.getElementById( 'instructions' );

function init() {
	camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 1000000);
	scene = new THREE.Scene();
	


	var textureLoader = new THREE.TextureLoader();
	var materials = [
		new THREE.MeshBasicMaterial( { map: textureLoader.load( 'images/px.jpg' ) } ), // right
		new THREE.MeshBasicMaterial( { map: textureLoader.load( 'images/nx.jpg' ) } ), // left
		new THREE.MeshBasicMaterial( { map: textureLoader.load( 'images/py.jpg' ) } ), // top
		new THREE.MeshBasicMaterial( { map: textureLoader.load( 'images/ny.jpg' ) } ), // bottom
		new THREE.MeshBasicMaterial( { map: textureLoader.load( 'images/pz.jpg' ) } ), // back
		new THREE.MeshBasicMaterial( { map: textureLoader.load( 'images/nz.jpg' ) } )  // front
	];
	mesh = new THREE.Mesh( new THREE.BoxGeometry( 10000, 10000, 10000, 7, 7, 7 ), new THREE.MultiMaterial( materials ) );
	mesh.scale.x = - 1;
	scene.add(mesh);
	//
	renderer = new THREE.WebGLRenderer(); // Detector.webgl? new THREE.WebGLRenderer(): new THREE.CanvasRenderer()
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	var container = document.getElementById('app').appendChild( renderer.domElement );



	// controls
	controls = new THREE.FlyControls( camera );
	controls.movementSpeed = 1000;
	controls.domElement = container;
	controls.rollSpeed = Math.PI / 24;
	controls.autoForward = false;
	controls.dragToLook = false;


	var socket = io.connect('http://localhost:1234');
    var self = this;

    socket.on('info', function (data) {
    	var tweetLength = data.tweet.text.length,
    		tweetColor  = data.tweet.user.profile_background_color;
    	// console.log("color: ", parseInt(tweetColor, 16));
    	var geometry = new THREE.BoxGeometry( tweetLength, tweetLength, tweetLength );
		var material = new THREE.MeshBasicMaterial( { color: parseInt(tweetColor, 16) } );
        var cube = new THREE.Mesh( geometry, material );
        cube.position.x = Math.random() * 800 - 400;
        cube.position.y = Math.random() * 800 - 400;
        cube.position.z = numCubes * -10;
        scene.add( cube );
        numCubes++;
    });


	// create the custom shader
	// var imagePreviewTexture = textureLoader.load( 'textures/crate.gif');
	// imagePreviewTexture.minFilter = THREE.LinearMipMapLinearFilter;
	// imagePreviewTexture.magFilter = THREE.LinearFilter;
	// pointShaderMaterial = new THREE.ShaderMaterial( {
	// 	uniforms: {
	// 		tex1: { type: "t", value: 0xFFFFFF },
	// 		zoom: { type: 'f', value: 9.0 },
	// 	},
	// 	vertexShader:   document.getElementById( 'vertexshader' ).textContent,
	// 	fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
	// 	transparent: true,
	// 	color: 0xFFFFFF
	// });

	//create particles with buffer geometry
	// var distanceFunction = function(a, b){
	// 	return Math.pow(a[0] - b[0], 2) +  Math.pow(a[1] - b[1], 2) +  Math.pow(a[2] - b[2], 2);
	// };

	// positions = new Float32Array( amountOfParticles * 3 );
	// alphas = new Float32Array( amountOfParticles );
	// _particleGeom = new THREE.BufferGeometry();
	// _particleGeom.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
	// _particleGeom.addAttribute( 'alpha', new THREE.BufferAttribute( alphas, 1 ) );
	// particles = new THREE.Points( _particleGeom, pointShaderMaterial );
	// for (var x = 0; x < amountOfParticles; x++) {
	// 	positions[ x * 3 + 0 ] = Math.random() * 1000;
	// 	positions[ x * 3 + 1 ] = Math.random() * 1000;
	// 	positions[ x * 3 + 2 ] = Math.random() * 1000;
	// 	alphas[x] = 1.0;
	// }
	// var measureStart = new Date().getTime();
	// // creating the kdtree takes a lot of time to execute, in turn the nearest neighbour search will be much faster
	// kdtree = new THREE.TypedArrayUtils.Kdtree( positions, distanceFunction, 3 );
	// console.log('TIME building kdtree', new Date().getTime() - measureStart);
	// // display particles after the kd-tree was generated and the sorting of the positions-array is done
	// scene.add(particles);
	window.addEventListener( 'resize', onWindowResize, false );
}


function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize( window.innerWidth, window.innerHeight );
	controls.handleResize();
}


function animate() {
	requestAnimationFrame( animate );
	//
	// displayNearest(camera.position);
	controls.update( clock.getDelta() );
	renderer.render( scene, camera );
}


// function displayNearest(position) {
// 	// take the nearest 200 around him. distance^2 'cause we use the manhattan distance and no square is applied in the distance function
// 	var imagePositionsInRange = kdtree.nearest([position.x, position.y, position.z], 100, maxDistance);
// 	// We combine the nearest neighbour with a view frustum. Doesn't make sense if we change the sprites not in our view... well maybe it does. Whatever you want.
// 	var _frustum = new THREE.Frustum();
// 	var _projScreenMatrix = new THREE.Matrix4();
// 	camera.matrixWorldInverse.getInverse( camera.matrixWorld );
// 	_projScreenMatrix.multiplyMatrices( camera.projectionMatrix, camera.matrixWorldInverse );
// 	_frustum.setFromMatrix( _projScreenMatrix );
// 	for ( i = 0, il = imagePositionsInRange.length; i < il; i ++ ) {
// 		var object = imagePositionsInRange[i];
// 		var objectPoint = new THREE.Vector3().fromArray( object[ 0 ].obj );
// 		if (_frustum.containsPoint(objectPoint)){
// 			var objectIndex = object[0].pos;
// 			// set the alpha according to distance
// 			alphas[ objectIndex ] = 1.0 / maxDistance * object[1];
// 			// update the attribute
// 			_particleGeom.attributes.alpha.needsUpdate = true;
// 		}
// 	}
// }

init();
animate();
