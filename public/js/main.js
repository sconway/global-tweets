var camera, scene, renderer, earth, clouds, $rows,
    mesh, controls, raycaster, INTERSECTED, paused,
    curMouse = new THREE.Vector2(), 
    mouse = new THREE.Vector2(),
    earthGroup = new THREE.Object3D(),
    pointGroup = new THREE.Object3D(),
    controlers = [],
    tweets = [],
    points = [],
    numTweets = 0,
    tweetCount = 0,
    searching = false,
    isHoveringOnTweet = false;

var POS_X = 1800;
var POS_Y = 500;
var POS_Z = 1800;
var MAP_HEIGHT = 150;
var MAP_WIDTH  = 300;
var RADIUS = 400;
var WIDTH = 1000;
var HEIGHT = 600;
var CAMERA_Z = 1000;
var POINT_SIZE = 1;


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

    document.addEventListener( 'mousemove', onDocumentMouseMove, false );
    window.addEventListener( 'resize', onWindowResize, false );
    window.addEventListener('mousewheel', mousewheel, false);

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

        tweetCount++;

        // only push our data up if the user is not hovering over a tweet
        // of searching through the list of tweets.
        if ( data && !paused && !searching) {
          tweets.push( data );
        }

        // update the total number of tweets
        $("#tweetCount").html( tweetCount );

    });

    setInterval(function() {

        if ( tweets[ numTweets ] && !paused && !searching ) {
            var coords = tweets[ numTweets ].coordinates.coordinates;

            $rows = $("#tweets li");

            prependText( tweets[ numTweets ] );
            drawPoint( coords[1], coords[0], RADIUS, 5, tweets[ numTweets ].sentiment.score );
            drawSecondaryPoint( coords[1], coords[0] );

            numTweets++;


            if ( numTweets > 75 ) {
                pointGroup.children.shift();
            }
        }

    }, 500);

}


/**
 * Creates and adds the THREEjs renderer, and sets the various
 * properties of it.
 */
function addRenderer() {
    renderer = new THREE.WebGLRenderer({ alpha : true, antialias: true });
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
    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.z = CAMERA_Z;
    camera.lookAt( scene.position );
    scene.add( camera );
}


/**
 * Creates and adds the earth to the scene.
 */
function addEarth() {
    var earthGeometry = new THREE.SphereGeometry( RADIUS, 50, 50 ),
        loader        = new THREE.TextureLoader(),
        color         = createGlowMaterial();

    // loads the earth image and once it is done, add the clouds.
    loader.load('images/earth.jpg', function(texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

        var earthMaterial = new THREE.MeshPhongMaterial( {
            map: texture,
            color: 0x1a75ff,
            transparent: true,
            opacity: 0.8,
            shininess: 0.9,
        } );

        earth = new THREE.Mesh(earthGeometry, earthMaterial);
        earth.name = "earth";
        earthGroup.add( earth );
        scene.add( earthGroup );

        // only enable the device controls if we're on a small device.
        if ( window.innerWidth < 1024 ) {
            controlers.push( new THREE.TrackballControls( camera ) );
            controlers.push( new THREE.DeviceOrientationControls( earthGroup , true ) );
        } else {
            controlers.push( new THREE.OrbitControls( camera, renderer.domElement ) );
            // controlers.push( new THREE.TrackballControls( camera ) );
        }

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
            opacity: 0.2
        } );

        clouds = new THREE.Mesh( cloudGeometry, cloudMaterial );
        clouds.scale.set( 1.015, 1.015, 1.015 );
        clouds.name = "clouds";

        earthGroup.add( clouds );
        earthGroup.add( pointGroup );

        paused = false;

        initFeed();
        animate();

    });
}


/**
 * Creates and adds the lights to the scene.
 */
function addLights() {
    light1 = new THREE.DirectionalLight( 0x3333ee, 2, 1000 );
    light1.position.set( POS_X/2, POS_Y/2, POS_Z );

    var hemLight = new THREE.HemisphereLight(0x333333, 0x333333, 1);
    scene.add(hemLight);

    var ambLight = new THREE.AmbientLight( 0xe7e7e7 );
    scene.add( ambLight );
}


/**
 * Creates and returns a material with a glowing effect.
 */
function createGlowMaterial() {
    return new THREE.ShaderMaterial( {
                uniforms: 
                { 
                    "c":   { type: "f", value: 1.0 },
                    "p":   { type: "f", value: 1.0 },
                    glowColor: { type: "c", value: new THREE.Color( 0xffffff ) },
                    viewVector: { type: "v3", value: camera.position }
                },
                vertexShader:   document.getElementById( 'vertexShader'   ).textContent,
                fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
                side: THREE.FrontSide,
                blending: THREE.AdditiveBlending,
                transparent: true
            } );
}


/**
 * convert the positions from a lat, lon to a position on a sphere.
 */
function latLongToVector3( lat, lon, radius, height ) {
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



function mousewheel(event) {

    var fovMAX = 160;
    var fovMIN = 1;

    camera.fov -= event.wheelDeltaY * 0.05;
    camera.fov = Math.max( Math.min( camera.fov, fovMAX ), fovMIN );
    camera.projectionMatrix = new THREE.Matrix4().makePerspective( 
                                                    camera.fov, 
                                                    window.innerWidth / window.innerHeight, 
                                                    camera.near, 
                                                    camera.far 
                                                );

}


/**
 * Draws a point on the sphere at the specified location.
 *
 * @param     x     :     float
 * @param     y     :     float
 *
 */
function drawPoint( x, y, rad, height, score ) {

    var pointGeometry = new THREE.SphereGeometry( POINT_SIZE, 32, 32 ),
        // pointMaterial = createGlowMaterial(),
        pointMaterial = new THREE.MeshPhongMaterial({
            color: getColor( score ),
            shininess: 0.8
        }),
        point = new THREE.Mesh( pointGeometry, pointMaterial ),
        posn  = latLongToVector3( x, y, rad, height );

    point.position.set( posn.x, posn.y, posn.z );
    // earthGroup.add( point );
    pointGroup.add( point );
    points.push( point );

    growObject( point );

    // setTimeout( function() {
    //     earthGroup.remove( point );
    // }, 20000);

}


/**
 * This function is used to draw the points on the 2D map that corresponds
 * to the main 3D globe. It creates a DOM element and appends it to the map
 * at the computed position.
 *
 * @param     lat    :    Integer
 * @param     lng    :    Integer
 *
 */
function drawSecondaryPoint(lat, lng) {
    var y = Math.round(((-1 * lat) + 90) * (MAP_HEIGHT / 180)),
        x = Math.round((lng + 180) * (MAP_WIDTH / 360)),
        $point = $("<div class='point'></div>").css({
            "left": x + "px",
            "top": y + "px"
        });

    $("#map").append( $point );
}


/**
 * Returns a color code based on the sentiment score. Colors range
 * from red to green.
 *
 * @param     score    :    Integer
 *
 */
function getColor( score ) {

    if ( score < -2 ) {
        return 0xff0000;
    } else if ( score < -1 ) {
        return 0xff8000;
    } else if ( score < 0 ) {
        return 0xffff00;
    } else if ( score == 0 ) {
        return 0xffffff;
    } else if ( score > 0 ) {
        return 0xbfff00;
    } else if ( score > 1 ) {
        return 0x40ff00;
    } else if ( score > 2 ) {
        return 0x00ff00;
    }

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
            searching = false;
        } else {
            searching = true;
            $rows     = $("#tweets li"); //otherwise $rows will miss an item

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

        paused = true;
        console.log( "position: ", points[ index ].position );
        window.removeEventListener( 'mousewheel', mousewheel );
    });

    $("#tweets").on( "mouseleave", "li", function() {
        paused = false;
        window.addEventListener('mousewheel', mousewheel, false);
    });


    $("#tweet").hover(function() {
        isHoveringOnTweet = true;
    }, function() {
        isHoveringOnTweet = false;
    })

}


/**
 * Scales the supplied object up by tweening the scale property.
 */
function growObject( sphere ) {
    new TWEEN.Tween( sphere.scale )
        .to({ 
            x: 5,
            y: 5,
            z: 5
        }, 500)
        .easing( TWEEN.Easing.Elastic.InOut )
        .onUpdate( function() {
            renderer.render(scene, camera);
        })
        .onComplete( function() {
        })
        .start();
}


/**
 * Used to display the search box on the page. Handles the addition
 * of classes that animate the search box, and reloading the page
 * with the entered searh term.
 */
function handleSearchTerm() {

    var $searchWrapper = $(".search-wrapper");

    $(document).on('click', function(event) {
        
        if ( $searchWrapper.hasClass("active") ) {

            // Use the value if there is one; remove the search box if not
            if ( $(".search-box").val() ) {
                location.search = 'term=' + $(".search-box").val();
            } else {
                $searchWrapper.removeClass("active");
            }

        }
        
    });

    // Toggles the search display and functionality
    $("#searchIcon").click( function( event ) {
        event.stopPropagation();

        if ( $searchWrapper.hasClass("active") ) {

            // Use the value if there is one; remove the search box if not
            if ( $("#searchBox").val() ) {
                location.search = 'term=' + $(".search-box").val();
            } else {
                $searchWrapper.removeClass("active");
            }

        } else {
            $searchWrapper.addClass("active");
            $(".search-box").focus();
        }

    });

    // If the enter key is pressed, check to see if a value should submit.
    $("#searchBox").keypress(function(event) {

        if (event.which == 13) {
            event.preventDefault();

            if ( $("#searchBox").val() ) {
                location.search = 'term=' + $(".search-box").val();
            }

        }

    });

    // Stop the document handler from seeing any click in the search box
    $("#searchBox").click( function( event ) { event.stopPropagation(); });
}


/**
 * Sets and reveals the container for the text of the hovered tweet.
 *
 * @param     x       :    Integer
 * @param     y       :    Integer
 * @param     tweet    :    Object
 *
 */
 function showText( tweet ) {

    var tweetLink = "https://twitter.com/" + tweet.screenname + "/status/" +tweet.twid, 
        tweetProf = "https://twitter.com/" + tweet.screenname;

    $("#tweet").
        css({
            left: curMouse.x - 5 + "px",
            top: curMouse.y - 5 + "px"
        }).
        addClass( "active" );

    $("#tweetText").html( tweet.body );
    $("#tweetImg").attr( "src", tweet.avatar );
    $("#tweetHandle").html( "@" + tweet.screenname );
    $("#tweetStatus").attr( "href",  tweetLink );
    $("#tweetProfile").attr( "href",  tweetProf );
 }


/**
 * Called when there is an intersection with one of the points on the globe.
 * 
 * @param     object    :    THREE.Mesh
 *
 */
function onIntersection( object ) {

    INTERSECTED = object;
    paused = true;
    console.log(INTERSECTED);

    var index = points.indexOf( object ),
        tweet  = tweets[ index ],
        curX  = curMouse.x,
        curY  = curMouse.y;

    showText( tweet );

    // console.log("intersection: ", object.position );
    // object.parent.lookAt( camera.position );

}


/**
 * Called when there aren't any intersections. Performs default behavior. 
 */
function onNoIntersections() {
    if ( !isHoveringOnTweet ) {
        INTERSECTED = null;
        paused = false;

        $("#tweet").removeClass("active");
    }
}


/**
 * loops through any controlers, calling the update function on them.
 */
function updateControlers() {
    var numControlers = controlers.length;

    for (var i = 0; i < numControlers; i++) {
        controlers[i].update();
    }
}


function animate() {
    requestAnimationFrame( animate );

    updateControlers();
    TWEEN.update();
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
        if ( INTERSECTED != intersects[ 0 ].object && !isHoveringOnTweet ) {
            onIntersection( intersects[ 0 ].object );
        }

    } else {
        onNoIntersections();
    }
}


$(window).load(function() {
    init();
    realTimeSearch();
    handleSearchTerm();
    handleTweetHover();
});

