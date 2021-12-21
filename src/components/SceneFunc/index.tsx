import { useEffect, useRef } from "react";
import * as THREE from 'three'

import Entity from "./Entity";
import { Player } from "./Player";
import { PlayerProps } from "./GameUtils";
import Unit from "./Unit";
import { Level } from "./Level";
import { Renderer } from "three";

function SceneFunc () {
    //console.dir(process.env);
    const mainDiv = useRef<HTMLDivElement>(null)
    const renderer = useRef<Renderer>(getMainGameRenderer(mainDiv.current));

    useEffect(() => {
        // while (mainDiv.current?.firstChild) {
            // mainDiv.current?.removeChild(mainDiv.current?.firstChild);
        // }
        if(mainDiv.current?.childNodes.length === 0) {
            mainDiv.current?.appendChild(renderer.current.domElement);
        }
    }, []);

    return (<div className="scene" style={{ margin: 'auto', width: '50%'}}ref = {mainDiv}>{}</div>);
};

function getMainGameRenderer (mainDiv: HTMLDivElement|null): THREE.WebGLRenderer  {
    const scene = new THREE.Scene();

    const entities:Entity[] = [];

    const camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
    
    camera.position.x = 0;
    camera.position.y = 10;
    camera.position.z = 15;

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

    let level = new Level(scene);

    let playerUnit = new Unit(clientPlayer, scene, level);
    await playerUnit.start();
    entities.push(playerUnit);
    clientPlayer.selectUnit(playerUnit);

    
    
    
    // Find path from A to B.
    // const groupID = pathfinding.getGroup(ZONE, a);
    // const path = pathfinding.findPath(a, b, ZONE, groupID);
  }


