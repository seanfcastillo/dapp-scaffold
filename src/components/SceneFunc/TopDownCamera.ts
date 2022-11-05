
import { Clock, Object3D, PerspectiveCamera, Renderer, Scene, Vector3 } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import Entity from "./Entity";

export class TopDownCamera implements Entity {
    scene: Scene;
    renderer: Renderer;
    camera: PerspectiveCamera | undefined;
    controls: OrbitControls | undefined;
    focusObject: Object3D|undefined;
    moveTimer: Clock;
    readonly FOCUS_TIME = 5*60;
    readonly MIN_DIST = 0.2;
    readonly Y_OFFSET = 11;
    readonly Z_OFFSET = -13;
    readonly X_ROT = (4*Math.PI)/3; //180*
    readonly Z_ROT = Math.PI; //180*

    constructor(scene, renderer) {
        this.scene = scene;
        this.renderer = renderer;
        this.moveTimer = new Clock();

    }

    async start() {
        const camera = new PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
        this.camera = camera;
    
        camera.position.x = 0;
        camera.position.y = this.Y_OFFSET;
        camera.position.z = this.Z_OFFSET;

        camera.rotateX(this.X_ROT);//-60);
        camera.rotateZ(this.Z_ROT);
    
        //const controls = new OrbitControls( camera, this.renderer.domElement );
        //this.controls = controls;
    }

    async update() {
        this.controls?.update();
        if(this.focusObject && this.camera) {
            let dist = this.camera!.position.distanceTo(this.focusObject.position);
            if(!this.moveTimer.running && dist >= this.MIN_DIST) {
                console.warn("camera needs to move. starting timer");
                this.moveTimer.start();
            }

            if(this.moveTimer.running && dist > this.MIN_DIST) {
                let offsetVec = new Vector3(this.focusObject.position.x, this.focusObject.position.y + this.Y_OFFSET, this.focusObject.position.z + this.Z_OFFSET);
                this.camera!.position.lerp(offsetVec, 0.05);
                //this.camera?.position.set(nextPos.x, nextPos.y, nextPos.z);
            } else if (this.moveTimer.running) {
                console.log("stopping timer. dist is: " + dist)
                this.moveTimer.stop();
            }

        }
    }

    setFocus(object: Object3D) {
        this.focusObject = object;
    }

    getPerspectiveCamera() {
        return this.camera;
    }
}
