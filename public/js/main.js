var camera, scene, renderer, earth, clouds, $rows,
    mesh, controls, raycaster, INTERSECTED, paused,
    curMouse = new THREE.Vector2(), 
    mouse = new THREE.Vector2(),
    earthGroup = new THREE.Object3D();
    tweets = [],
    points = [],
    numPoints = 0;

var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;
var RADIUS = 400;
var WIDTH = 1000;
var HEIGHT = 600;
var POINT_SIZE = 5;


/**
 * Starts off the rendering process and calls the functions to add objects
 * to the scene.
 */
function init() {
    
    scene = new THREE.Scene();

    addRenderer();
    addCamera();
    addEarth();
    addLights();
    
    // initialize the raycaster(for hovering), and the orbit controls(for dragging)
    raycaster = new THREE.Raycaster();
    controls  = new THREE.OrbitControls( camera, renderer.domElement );

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );

}


/**
 * Creates the socket connection with the server, and uses the data that
 * is sent over to create the map points, text display, etc..
 */
function initFeed() {

    var socket = io.connect();

    // when a new tweet comes in, draw a point on the globe in the location
    // specified by the supplied coordinates.
    socket.on('tweet', function (data) {
      var coords = data.coordinates.coordinates;

      $rows = $("#tweets li");

      tweets.push( data );
      prependText( data );
      drawPoint(coords[1], coords[0], RADIUS, 5);
    });

}


/**
 * Creates and adds the THREEjs renderer, and sets the various
 * properties of it.
 */
function addRenderer() {
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x000000, 1 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.shadowMapSoft = true;
    renderer.sortObjects = false;
    document.getElementById( 'viewport' ).appendChild( renderer.domElement );
}


/**
 * Creates and adds the camera to the scene
 */
function addCamera() {
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 1000;
    camera.lookAt( scene.position );
    scene.add( camera );
}


/**
 * Creates and adds the earth to the scene.
 */
function addEarth() {
    var earthGeometry = new THREE.SphereGeometry( RADIUS, 50, 50 ),
        loader        = new THREE.TextureLoader();

    // loads the earth image and once it is done, add the clouds.
    loader.load('images/earth-gray.jpg', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        var earthMaterial = new THREE.MeshPhongMaterial( {
            map: texture,
            shininess: 0.6,
        } );

        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.name = "earth";
        earthGroup.add( earth );
        scene.add( earthGroup );

        addClouds();
        
    });
}


/**
 * Creates and adds the clouds to the scene.
 */
function addClouds() {
    var cloudGeometry = new THREE.SphereGeometry( RADIUS, 50, 50 ),
        loader        = new THREE.TextureLoader();

    // Loads the clouds image and once it is done, start the visualization.
    loader.load('images/earth-clouds.png', function( texture ) {

        var cloudMaterial = new THREE.MeshPhongMaterial( {
            map: texture,
            transparent: true,
            opacity: 0.4
        } );

        clouds = new THREE.Mesh( cloudGeometry, cloudMaterial );
        clouds.scale.set( 1.015, 1.015, 1.015 );
        clouds.name = "clouds";

        earthGroup.add( clouds );

        paused = false;

        initFeed();
        animate();

    });
}


/**
 * Creates and adds the lights to the scene.
 */
function addLights() {
    light1 = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
    light1.position.set(POS_X, POS_Y, POS_Z);

    light2 = new THREE.DirectionalLight(0x3333ee, 3.5, 500 );
    light2.position.set(-POS_X/2, -POS_Y, -POS_Z);

    scene.add( light1 );
    scene.add( light2 );
}


/**
 * convert the positions from a lat, lon to a position on a sphere.
 */
function latLongToVector3(lat, lon, radius, height) {
    var phi = (lat)*Math.PI/180;
    var theta = (lon-180)*Math.PI/180;

    var x = -(radius+height) * Math.cos(phi) * Math.cos(theta);
    var y = (radius+height) * Math.sin(phi);
    var z = (radius+height) * Math.cos(phi) * Math.sin(theta);

    return new THREE.Vector3( x, y, z );
}


/**
 * Updates the display of the scene whenever the window is resized.
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}


/**
 * Called every time the mouse moves, it updates the current position
 * of the cursor.
 */
function onDocumentMouseMove( event ) {
    event.preventDefault();

    curMouse.x = event.clientX;
    curMouse.y = event.clientY;
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}


/**
 * Draws a point on the sphere at the specified location.
 *
 * @param     x     :     float
 * @param     y     :     float
 *
 */
function drawPoint(x, y) {

    var pointGeometry = new THREE.SphereGeometry( POINT_SIZE, 32, 32 ),
        pointMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFFFFF,
            shininess: 0.8
        }),
        point = new THREE.Mesh( pointGeometry, pointMaterial ),
        posn  = latLongToVector3( x, y, RADIUS, 10 );

    point.position.set( posn.x, posn.y, posn.z );
    earthGroup.add( point );
    points.push( point );

    numPoints++;

}


/**
 * Prepends the tweet text to the tweets container each time
 * it is called. 
 */
function prependText(tweet) {
    // console.log("appending tweet");
    var $li = "<li>" + tweet.body + "</li>";

    $("#tweets").prepend( $li );
}


/**
 * Filters the tweets in the tweet box when there is something typed
 * in the input field. The addition of cubes and the animation is 
 * set to be stopped when there is a filter term present.
 */
function realTimeSearch() {

    $('#tweetSearch').keyup(function() {
        var val = $.trim($(this).val()).replace(/ +/g, ' ').toLowerCase();

        // If there's no value in the tweet search field, resume
        // the feed as it was before. Otherwise, set the mutex
        // so the feed will not continue while we are filtering.
        if ( val.length < 1 ) {
            feedMutex = false;
        } else {
            feedMutex = true;

            $rows.show().filter(function() {
                var text = $(this).text().replace(/\s+/g, ' ').toLowerCase();
                return !~text.indexOf( val );
            }).hide();
        }
    });

}


/**
 * This function handles a hover on one of the listed tweets in the sidebar.
 * When the tweet text is hovered over, it will be highlighted, and the 
 * corresponding point on the map will be turned to.
 */
function handleTweetHover() {

    $("#tweets").on( "mouseenter", "li", function() {
        var index = $(this).index();

        console.log("color: ", points[ index ].material.color);
        points[ index ].material.color = 0x00FF00;
    });

}


/**
 * Sets and reveals the container for the text of the hovered tweet.
 *
 * @param     x       :    Integer
 * @param     y       :    Integer
 * @param     text    :    String
 *
 */
 function showText( x, y, text ) {
    $("#tweetText").
        css({
            left: x + "px",
            top: y + "px"
        }).
        html( text ).
        addClass( "active" );
 }


/**
 * Called when there is an intersection with one of the points on the globe.
 * 
 * @param     object    :    THREE.Mesh
 *
 */
function onIntersection( object ) {
    if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

    INTERSECTED = object;
    paused = true;
    INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
    INTERSECTED.material.emissive.setHex( 0xffffff );

    var index = points.indexOf( object ),
        text  = tweets[ index ].body,
        curX  = curMouse.x,
        curY  = curMouse.y;

    showText( curMouse.x, curMouse.y, text );

    // console.log("intersection: ", object.position );
    // object.parent.lookAt( camera.position );

}


/**
 * Called when there aren't any intersections. Performs default behavior. 
 */
function onNoIntersections() {
    if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    INTERSECTED = null;
    paused = false;

    $("#tweetText").removeClass("active");
}


function animate() {
    requestAnimationFrame( animate );

    controls.update();
    renderer.render( scene, camera );
    raycaster.setFromCamera( mouse, camera );

    // only spin the object if the animation is not paused.
    if ( !paused ) {
        earthGroup.rotation.y += 0.001;
        clouds.rotation.y += 0.0005;
    }


    // find any intersections
    var intersects = raycaster.intersectObjects( points, true );

    // make sure something was intersected
    if ( intersects.length > 0 ) {

        // if a different object is hovered on and it's a map point.
        if ( INTERSECTED != intersects[ 0 ].object ) {
            onIntersection( intersects[ 0 ].object );
        }

    } else {
        onNoIntersections();
    }
}


$(window).load(function() {
    init();
    realTimeSearch();
    handleTweetHover();
});

