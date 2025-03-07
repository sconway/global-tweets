// I know it's messy....
import * as THREE from 'three'
import { Detector } from '../utils/detector.js';


if (!window.WebGLRenderingContext || !Detector.webgl) {
    // the browser doesn't even know what WebGL is
    window.location = "http://get.webgl.org";
}

export const canvas = document.getElementById('canvas')

// canvas.node().getContext("webgl");

export var renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas
  });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor( 0x666666, 0 );
document.getElementById("three-container").appendChild(renderer.domElement);

export var camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
camera.position.z = 1000;

export var scene = new THREE.Scene();

export var light = new THREE.HemisphereLight('#aaaaaa', '#ffffff', 2);
// light.position.set(0, 1000, 0);
scene.add(light);

export var spotLight = new THREE.SpotLight('#ffffff', 4, 1500);
spotLight.position.set(600, 600, 200);
scene.add(spotLight);

export var light2 = new THREE.AmbientLight('#000000');
scene.add(light2);

// export var pLight = new THREE.PointLight( 0x382005, 5, 1000 );
// pLight.position.set( 0, 0, 0 );
// scene.add( pLight );

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
