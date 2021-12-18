import * as THREE from 'three'
import { Line, MeshBasicMaterial, PerspectiveCamera, Scene, Vector2, Vector4, WebGLRenderer } from "three";
import Entity from "./Entity";
import { drawCircle, PlayerProps } from "./GameUtils";
import Unit from "./Unit";

export class Player implements Entity {
    ownedUnits: Unit[] = [];

    selectedUnit: Unit | undefined;
    scene!: Scene;
    selector!: Line;
    pointSelector!: Line;
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    camera: PerspectiveCamera;
    canvas: WebGLRenderer;
    divPosition;

    constructor(playerProps: PlayerProps) {
        this.scene = playerProps.scene;
 
        // init selector
        this.selector = drawCircle(.5, 32);
        this.scene.add(this.selector);
        this.selector.visible = false;

        this.pointSelector = drawCircle(.5, 32);
        this.scene.add(this.pointSelector);
        this.pointSelector.visible = false
        
        this.camera = playerProps.camera;
        this.canvas = playerProps.canvas;
        if(playerProps.mainDiv != null) {
            this.divPosition = new Vector2(playerProps.mainDiv.getBoundingClientRect().left, playerProps.mainDiv.getBoundingClientRect().top);
        }
        

        window.addEventListener( 'mousemove', this.onMouseMove.bind(this), true );
        window.addEventListener( 'mousedown', this.onMouseDown.bind(this), true );
    }

    selectUnit(unit:Unit) {
        this.selectedUnit = unit;

        if(unit.getMesh() !== undefined) {
            this.selector.visible = true;
            this.selector.position.x = unit.getMesh()!.position.x;
            this.selector.position.z = unit.getMesh()!.position.z;
            this.selector.position.y = unit.getMesh()!.position.y+.05;
        }
    }

    giveUnit(unit) {
        this.ownedUnits.push(unit);
    }

    update() {
        // mouse stuff //
        // update the picking ray with the camera and mouse position
        //console.log(this.mouse);

        // end mouse stuff //
    }

    onMouseMove( event ) {
        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        if(this.mouse !== undefined) {
            //console.log(this.mouse);
            // this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
            // this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
            let viewport = new Vector4();
            let canvasSize = new Vector2();
            this.canvas.getViewport(viewport);
            this.canvas.getSize(canvasSize);
            
            //console.log("viewport: " + viewport.x + " " + viewport.y + " " + viewport.width + " " + viewport.height);
            //console.log("canvas: " + canvasSize.x + " " + canvasSize.y);
            //console.log("div: " + this.divPosition.x + " " + this.divPosition.y);

            this.mouse.x = ( (event.clientX - this.divPosition.x) / canvasSize.x )*2 - 1;
            this.mouse.y =  -( (event.clientY - this.divPosition.y) / canvasSize.y)*2 + 1;
        } else {
            this.mouse = new THREE.Vector2();
            console.log("mouse is undefined");
        }
    
    }

    onMouseDown( event ) {
        let done = false;
        if(!done) {

            var vec = new THREE.Vector3(); // create once and reuse
            var pos = new THREE.Vector3(); // create once and reuse

            vec.set(
                ( event.clientX / window.innerWidth ) * 2 - 1,
                - ( event.clientY / window.innerHeight ) * 2 + 1,
                0.5 );

            vec.unproject( this.camera );

            vec.sub( this.camera.position ).normalize();

            var distance = - this.camera.position.z / vec.z;

            pos.copy( this.camera.position ).add( vec.multiplyScalar( distance ) );












            //console.log( "ray: " + this.raycaster +" mouse: " + this.mouse + ", cam: " + this.camera);
            console.log("mx: " + this.mouse.x + ", my: " + this.mouse.y);
            this.raycaster.setFromCamera( this.mouse, this.camera );

            


            // calculate objects intersecting the picking ray
            const intersects = this.raycaster.intersectObjects( this.scene.children );

            //for ( let i = 0; i < intersects.length; i ++ ) {
            if(intersects.length > 0) {
                this.pointSelector.visible = true;
                let intersect =  intersects[ 0 ];
                // (intersects[ i ].object as THREE.Mesh).material = new MeshBasicMaterial({color: 0x000000});
                
                this.pointSelector.position.x = intersect.point.x;
                this.pointSelector.position.z = intersect.point.z;
                this.pointSelector.position.y = intersect.point.y;//+.01;
               // console.log("intersect x: " + intersect.point.x + ", intersect z: " + intersect.point.z + ", intersect y: " + intersect.point.y);
               console.log("hit");
            }        
        }
        done = true;
    }
}