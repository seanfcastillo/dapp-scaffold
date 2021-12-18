import React, { useEffect, useRef } from "react";
import * as THREE from 'three'
import {GLTF, GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Pathfinding } from 'three-pathfinding';
import { Loader, MeshBasicMaterial, Object3D, ObjectLoader, Scene, Vector2, Vector3 } from "three";
import Entity from "./Entity";
import { Player } from "./Player";
import { drawCircle, loadModelAndAddToScene, PlayerProps } from "./GameUtils";
import Unit from "./Unit";

function SceneFunc () {
    //console.dir(process.env);
    const mainDiv = useRef<HTMLDivElement>(null)
    let renderer;
         useEffect(() => {
            renderer = getMainGameRenderer(mainDiv.current);
            while (mainDiv.current?.firstChild) {
                mainDiv.current?.removeChild(mainDiv.current?.firstChild);
            }
            if(mainDiv.current?.childNodes.length === 0) {
                mainDiv.current?.appendChild(renderer.domElement);
            }
         }, []);

         return (<div className="scene" style={{ margin: 'auto', width: '50%'}}ref = {mainDiv}>{}</div>);
    };

function getMainGameRenderer (mainDiv: HTMLDivElement|null): THREE.WebGLRenderer  {
    const scene = new THREE.Scene();

    const entities:Entity[] = [];

    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    
    camera.position.x = 0;
    camera.position.y = 15;
    camera.position.z = 15

    const renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    const playerProps = {camera: camera, canvas: renderer, mainDiv: mainDiv, scene: scene};
    generateLevel(scene, entities, playerProps);

    //Create a DirectionalLight and turn on shadows for the light
    const dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
    dirLight.position.set( 0, 15, 0 ); //default; light shining from top
    dirLight.castShadow = true; // default false
    scene.add( dirLight );
    
    const ambLight = new THREE.AmbientLight( 0x404040, .25 ); // soft white light
    //ambLight.castShadow = true;
    //ambLight.position.set( 0, 1, 0 );
    scene.add( ambLight );
    
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial( { color: 0xDE1F1F } );
    const cube = new THREE.Mesh( geometry, material );
    
    
    scene.add( cube );
    cube.position.x = 2;
    

    
    camera.rotateX(-89);//-60);

    
    

    // main update loop
    function update() {
        renderer.render( scene, camera );
        cube.rotateX(.01);
        entities.forEach(entity => {
            entity.update();
        })
    }

    // resizer
    const resizer = new Resizer(window, camera, renderer);
    resizer.onResize = () => {
        renderer.render( scene, camera);
    };

    

    update();
    renderer.setAnimationLoop(update);
    

    
    return renderer;
}

export default SceneFunc;

const sizeFactor = 2;
const setSize = (container, camera, renderer: THREE.WebGLRenderer) => {
    camera.aspect = container.innerWidth/sizeFactor / container.innerHeight*sizeFactor;
    camera.updateProjectionMatrix();

    renderer.setSize(container.innerWidth/sizeFactor, container.innerHeight/sizeFactor);
    renderer.setPixelRatio(window.devicePixelRatio);
  };

class Resizer {
    constructor(container, camera, renderer) {
      // set initial size on load
      setSize(container, camera, renderer);
  
      window.addEventListener('resize', () => {
        // set the size again if a resize occurs
        setSize(container, camera, renderer);
        // perform any custom actions
        this.onResize();
      });
    }
  
    onResize() {}
  }


  async function generateLevel(scene, entities, playerProps: PlayerProps) {
      
    let clientPlayer = new Player(playerProps);
    entities.push(clientPlayer);

    let playerUnit = new Unit(clientPlayer, scene);
    await playerUnit.start();
    entities.push(playerUnit);
    clientPlayer.selectUnit(playerUnit);



    const glbLoader = new GLTFLoader();
    let level;
    await loadModelAndAddToScene(glbLoader, '../models/glb/level1.glb').then((obj) => {level = obj})
    scene.add(level.scene);
    level.scene.position.x = 35;
    level.scene.position.z = 5;
  
    
    let rawNavMesh;
    let navMesh;
    await loadModelAndAddToScene(glbLoader, '../models/glb/level1_nav.glb').then((obj) => {rawNavMesh = obj})
    rawNavMesh.scene.traverse((node) => {
        if (node.isMesh) navMesh = node;
    });
    // Create level.
    const pathfinding = new Pathfinding();
    const ZONE = 'level1';
    pathfinding.setZoneData(ZONE, Pathfinding.createZone(navMesh.geometry));
    
    // Find path from A to B.
    // const groupID = pathfinding.getGroup(ZONE, a);
    // const path = pathfinding.findPath(a, b, ZONE, groupID);
  }


