import { useEffect, useRef } from "react";
import * as THREE from 'three'
import { IngamePopup } from "../IngamePopup";

import Entity from "./Entity";
import { GameStateManager } from "./GameStateManager";
import { GuiManager } from "./GuiManager";
import { TopDownCamera } from "./TopDownCamera";

function SceneFunc () {
    //console.dir(process.env);
    const mainDiv = useRef<HTMLDivElement>(null)
    // let renderer = useRef<Renderer>(null);
    // if(renderer.current === null) {
    //   renderer = useRef<Renderer>(g);
    // }

    useEffect(() => {
        // while (mainDiv.current?.firstChild) {
            // mainDiv.current?.removeChild(mainDiv.current?.firstChild);
        // }
        if(mainDiv.current?.childNodes.length === 0) {
            const renderer = getMainGameRenderer(mainDiv.current).then((rendererRetruned)=>{
              mainDiv.current?.appendChild(rendererRetruned.domElement);
            });
           
        }
    }, []);

    return (<div className="scene" style={{ margin: 'auto', width: '50%'}}ref = {mainDiv}>{}</div>);
};


// only show if wallet selected or user connected
// const menu = (
//   <Menu>
//     {wallets.map((wallet) => (
//       <Menu.Item key={wallet.name} onClick={() => select(wallet.name)}>
//         Change Wallet to {wallet.name}
//       </Menu.Item>
//     ))}
//   </Menu>
// );

function GetPopUp() {
  let popup = IngamePopup({
    onClick: null,
    disabled: false
  });
  return popup;
}

async function getMainGameRenderer (mainDiv: HTMLDivElement|null): Promise<THREE.WebGLRenderer>  {
    const scene = new THREE.Scene();

    const entities:Entity[] = [];

    const renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // default THREE.PCFShadowMap

    const topDownCamera = new TopDownCamera(scene, renderer);
    await topDownCamera.start();
    entities.push(topDownCamera);

    const guiManager = new GuiManager(mainDiv!);

    const playerProps = {camera: topDownCamera, canvas: renderer, mainDiv: mainDiv, scene: scene, guiManager: guiManager};

    let gameManager = new GameStateManager(scene, entities, playerProps, mainDiv);
    await gameManager.start();
    let level = gameManager.currentLevel;

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
    cube.position.x = 35;
    

    // main update loop
    function update() {
      if(topDownCamera.getPerspectiveCamera()) {
        renderer.render( scene, topDownCamera.getPerspectiveCamera()! );
      }
      cube.rotateX(.01);
      level?.world.fixedStep();
      entities.forEach(entity => {
          entity.update();
      })
    }

    // resizer
    const resizer = new Resizer(window, topDownCamera.getPerspectiveCamera(), renderer);
    resizer.onResize = () => {
      if(topDownCamera.getPerspectiveCamera()) {
        renderer.render( scene, topDownCamera.getPerspectiveCamera()!);
      }
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

 


