import { Box, Vec3, Body, Sphere } from 'cannon-es';
import * as THREE from 'three'
import { Box3, BoxGeometry, BoxHelper, Color, Line, Material, Mesh, MeshBasicMaterial, Object3D, Scene, SphereGeometry, Vector2, Vector3 } from "three";
import Entity from "./Entity";
import { GameStateManager, ServerGameState } from './GameStateManager';
import { COLLISION_FILTER_PHYSICS, COLLISION_FILTER_UNIT, loadModel } from "./GameUtils";
import { Level } from './Level';
import { Player } from "./Player";

export const DEFAULT_MAX_HEALTH = 100;

export class Unit implements Entity {
    health: number;
    owner: Player|null;
    mesh: Object3D | undefined;
    scene: Scene;
    level: Level;
    path: Vector3[] | undefined;
    lineGuideMesh: Line | undefined;
    collidingBodies: Body[]
    gameStateManager: GameStateManager;
    readonly startPos: Vector3;
    readonly MESH_URL:string = '../models/json/human.json';
    readonly objLoader = new THREE.ObjectLoader();
    readonly COLOR_GREEN = 0x00FF08;
    readonly COLOR_RED = 0xFF0000;
    readonly COLOR_PINK = 0xFF00F7;

    constructor(owner: Player|null, scene: Scene, level: Level, startPos: Vector3, gameStateManager) {
        this.health = DEFAULT_MAX_HEALTH;
        this.owner = owner;
        this.scene = scene;
        this.level = level;
        this.startPos = startPos;
        this.path = [];
        this.colliderOutline = new BoxHelper(new Object3D(), 0x00ff0);
        this.colliderBody = undefined;
        this.collidingBodies = [];
        this.gameStateManager = gameStateManager;
    }

    colliderOutline: BoxHelper;
    colliderBody: Body|undefined;
    readonly COLLIDER_OFFSETY = .73;
    ballBody: Body | undefined;
    ballOutline: Mesh | undefined;
    async start() {
        let mesh;
        await loadModel(this.objLoader, this.MESH_URL).then((obj) => {mesh = obj});
        this.mesh = mesh;
        this.mesh = this.mesh!;
        this.scene.add(this.mesh);

        this.mesh.position.x = this.startPos.x;
        this.mesh.position.z = this.startPos.z;
        this.mesh.position.y = this.startPos.y;
        this.mesh.scale.x = 2;
        this.mesh.scale.y = 2;
        this.mesh.scale.z = 2;
        //setTimeout(() => {  this.level.moveObjectToClosestNode(this.mesh); }, 2000);
        // let bbox = new THREE.Box3().setFromObject(mesh);
 
        // let worldPos: Vector3 = new Vector3(this.mesh.position.x,this.mesh.position.y+this.COLLIDER_OFFSETY,this.mesh.position.z);
        // (this.mesh as Object3D).getWorldPosition(worldPos);
        // bbox.translate(worldPos);
        // //bbox.applyMatrix4(this.mesh.matrix);
        // let size: Vector3 = new Vector3();
        // bbox.getSize(size);
        // const geometry2 = new BoxGeometry( size.x, size.y, size.z );
        // const material2 = new MeshBasicMaterial( { color: 0xffff00, wireframe: true } );
        // this.collider = new Mesh( geometry2, material2 );
        // this.scene.add(this.collider);
        this.colliderOutline = new BoxHelper(this.mesh, this.COLOR_GREEN);
        this.colliderOutline.visible = true;
        this.scene.add(this.colliderOutline);

        let bbox = new Box3();
        bbox.setFromObject(this.mesh);
        let size = new Vector3();
        bbox.getSize(size);

        this.colliderBody = new Body({
            mass: 1,
            shape: new Box(new Vec3(size.x/2, size.y/2, size.z/2)),
            isTrigger: false,
            collisionFilterGroup: COLLISION_FILTER_UNIT,
            collisionFilterMask: (COLLISION_FILTER_UNIT | COLLISION_FILTER_PHYSICS)
        })
        this.level.world.addBody(this.colliderBody);
        this.colliderBody.position.set(this.mesh.position.x,this.mesh.position.y+this.COLLIDER_OFFSETY,this.mesh.position.z);
        this.colliderBody.addEventListener('collide', (event)=>{this.onCollisionEnter(event, this);});
        this.colliderBody.addEventListener('endContact', (event)=>{this.onCollisionExit(event, this);});
        console.warn(`Unit: created a body of id ${this.colliderBody.id}`);

         // make a ball
        //  const radius = 1 // m
        //  const sphereBody = new Body({
        //      mass: 5, // kg
        //      shape: new Sphere(radius),
        //      isTrigger: false,
        //      collisionFilterGroup: COLLISION_FILTER_PHYSICS
        //  });
        //  sphereBody.position.set(3.5, 2, .5) // m
        //  this.level.world.addBody(sphereBody)
        //  this.ballBody = sphereBody;
        //  console.warn(`Ball: created a body of id ${this.ballBody.id}`);

        const geometry = new SphereGeometry(.25, 32, 16 );
        const material = new MeshBasicMaterial( { color: this.COLOR_GREEN } );
        const sphere = new Mesh( geometry, material );
        this.scene.add( sphere );
        this.ballOutline = sphere;
    }

    getMesh() {
        return this.mesh;
    }

    SPEED = 0.02*5;
    directionVector = new Vector3();
    FLOAT_ONE = 1.0;
    EMPTY_VECTOR_ARRAY = new Vector3()[0];
    MIN_DIST = 0.01;
    update() {
        if(this.colliderBody && this.mesh) {
            this.colliderBody.position.set(this.mesh.position.x,this.mesh.position.y+this.COLLIDER_OFFSETY,this.mesh.position.z);
            //this.colliderBody.updateAABB();
            this.colliderOutline.position.set(this.colliderBody.position.x,this.colliderBody.position.y,this.colliderBody.position.z);
            this.colliderOutline.update();
            if(this.ballBody) {
                this.ballOutline?.position.set(this.ballBody!.position.x, this.ballBody!.position.y, this.ballBody!.position.z);
            }
            //console.log("pos: " +this.colliderBody.position);
        }

        let distSquared = -1;
        if(this.path && this.mesh && this.path.length > 0) {
            distSquared = this.mesh!.position.distanceToSquared(this.path[0]);
        }

        // movement handling
        if(this.path && this.mesh && this.path.length > 0 && this.health > 0) {
            //console.log(`path length: ${this.path.length}`);
            //console.log("movement: moving");
            let pointA = this.mesh!.position;
            let pointB = this.path[0];

            this.directionVector.subVectors(pointB, pointA);
            this.directionVector.clampLength(this.FLOAT_ONE, this.FLOAT_ONE);
            let destVector = pointA.add(this.directionVector.multiplyScalar(this.SPEED));

            // const groupID = this.level.pathfinding.getGroup(this.level.ZONE, destVector, true);
            // let nextNodePoint: Vector3  = this.level.pathfinding.getClosestNode(destVector, this.level.ZONE, groupID, true);
            // only move to destVector if destVector lies on the point from pointA to pointB
            //if(pointA.distanceToSquared(destVector) + destVector.distanceToSquared(pointB) === pointA.distanceToSquared(pointB)) {

            // TODO(donmccurdy): Don't clone targetPosition, fix the bug.
            const groupID = this.level.pathfinding.getGroup(this.level.ZONE, pointA, true);
            const closestPlayerNode = this.level.pathfinding.getClosestNode( pointA, this.level.ZONE, groupID );
		    const clamped = new THREE.Vector3();

            let clampedStep = this.level.pathfinding.clampStep(
                pointA, destVector.clone(), closestPlayerNode, this.level.ZONE, groupID, clamped );
            
            this.mesh!.position.copy(destVector);
        }
        
        
        if(this.path && this.mesh && this.path.length > 0 && distSquared <= this.MIN_DIST) {
            //console.log("movement: stopped");
            //this.mesh!.position.copy(this.path[0]);
            if(this.path.length > 1) {
                this.path = this.path.slice(1);
                //this.moveOrder(this.path[this.path.length-1]);
            } else {
                this.path = this.path.slice(1);
            }
        }
    }

    onCollisionEnter(event, thisUnit: Unit)  {
       if(thisUnit && event && event.body && event.contact !== undefined) {
            let body = event.body as Body;
            let contact = event.contact as Body;
            // console.warn(`collision - bodies are valid. 
            // bodyiD: ${body.id}, 
            // contactiD: ${contact.id}, 
            // bodyIsTrigger: ${body.isTrigger}, 
            // contactIsTrigger: ${body.isTrigger}, 
            // bodyPosition: ${body.position}, 
            // contactPosition: ${contact.position}, 
            // thisUnitPosition: ${thisUnit.mesh?.position}
            // `);

            if( 
                thisUnit.health > 0 &&
                thisUnit.gameStateManager.serverGameState === ServerGameState.started) {
                    console.warn(`dies`);
                    thisUnit.die();
            }
        }
    }

    onCollisionExit(event, thisUnit: Unit) {
        console.warn("EndCol");
        if(thisUnit.colliderBody == null) {
            return;
        }

        if(event.bodyA === thisUnit.colliderBody || event.bodyB === thisUnit.colliderBody) {
            thisUnit.collidingBodies.splice(event.bodyA === thisUnit.colliderBody? event.bodyB : event.bodyA);
        }

        if(thisUnit.collidingBodies.length === 0) {
            thisUnit.colliderOutline.material = new MeshBasicMaterial({
                color: thisUnit.COLOR_GREEN,
                wireframe: true
            });
        }
        console.log(`collision exit. event: ${event}. collisions: ${thisUnit.collidingBodies.length}`);
    }

    takeDamage(rawDamage: number) {
        this.health -= rawDamage;
        if(this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    moveOrder(targetPos: Vector3) {
        if(this.mesh && this.health > 0){
            this.path = this.level.getPath(this.mesh.position, targetPos, this.mesh);
            
            if(this.path?.length === 1 ) {
                let CUTOFF = .175;
                let distSquared = this.mesh!.position.distanceToSquared(this.path![0]);
                if(distSquared > CUTOFF) {
                    console.log(`long segment - ${distSquared} >= ${CUTOFF}`);
                    setTimeout(() => {  
                        if(this.path && this.path.length > 0) {
                            //console.warn("BAD PATHFINDING.. TRYING TO FIX"); 
                            //this.moveOrder(this.path[this.path.length-1])
                        } else {
                            //console.warn("BAD PATHFINDING - but couldnt do anything about it");
                        }
                    }, 250);
                } else {
                    //console.log(`short segment - ${distSquared} < ${CUTOFF}`);
                }
            }

            if(this.path) {
                //console.log("path length: " + this.path.length);
                //this.drawLine(this.path);
            }
            // this.level.pathfinding.clampStep(
            //     this.mesh.position, targetPosition.clone(), closestPlayerNode, ZONE, groupID, clamped );
        }
    }

    die() {
        this.health = 0;
        this.path = [];
        this.colliderOutline.material = new MeshBasicMaterial({
            color: this.COLOR_RED,
            wireframe: true
        });
        this.owner?.displayDeathMessage();
    }

    drawLine(path: Vector3[]) {
        //create a blue LineBasicMaterial
        let height = .5;
        let linePath: Vector3[] = JSON.parse(JSON.stringify(path));

        let lenOne = false;
        if(linePath.length === 1) {
            lenOne = true;
            linePath = [this.mesh!.position, ...linePath];
        }
        for(let i=0;i<linePath.length;i++) {
            linePath[i].y += height;
        }

        if(this.lineGuideMesh) {
            this.scene.remove(this.lineGuideMesh!);
            this.lineGuideMesh.geometry.dispose();
            (this.lineGuideMesh.material as Material).dispose();
            this.lineGuideMesh = undefined;
        }
        const material = lenOne? new THREE.LineBasicMaterial( { color: 0xDE1F1F } ) : new THREE.LineBasicMaterial( { color: 0x0000ff } );
        const geometry = new THREE.BufferGeometry().setFromPoints( linePath );
        const line = new THREE.Line( geometry, material );
        this.lineGuideMesh = line;
        this.scene.add(line);
    }

}

export default Unit;