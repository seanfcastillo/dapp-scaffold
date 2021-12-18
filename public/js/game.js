// @ts-check
/*todo: add Colyseus implementation https://www.colyseus.io/*/ 
//import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
//import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
//const THREE = require('three');
import * as THREE from 'three'

const loader = new THREE.ObjectLoader();
const scene = new THREE.Scene();
loader.load(
	// resource URL
	'../models/json/human.json',

	// onLoad callback
	// Here the loaded data is assumed to be an object
	function ( obj ) {
		// Add the loaded object to the scene
		scene.add(obj);
	},

	// onProgress callback
	function ( xhr ) {
		console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
	},

	// onError callback
	function ( err ) {
		console.error( 'An error happened' );
	}
);



const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

//Create a DirectionalLight and turn on shadows for the light
const dirLight = new THREE.DirectionalLight( 0xffffff, 100 );
dirLight.position.set( 0, 1, 0 ); //default; light shining from top
dirLight.castShadow = true; // default false
scene.add( dirLight );

const ambLight = new THREE.AmbientLight( 0x404040 ); // soft white light
scene.add( ambLight );

document.getElementById("sceneId")?.appendChild( renderer.domElement );

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
const cube = new THREE.Mesh( geometry, material );


//myScene.add( cube );

const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.x = 0;
camera.position.y = 5;
camera.position.z = 2.43;
//camera.position.x = new THREE.Vector3(0, 5, 2.42);

camera.rotateX(-60);

function animate() {
  requestAnimationFrame( animate );
  renderer.render( scene, camera );
}
animate();
