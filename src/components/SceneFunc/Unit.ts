import * as THREE from 'three'
import { Object3D, Scene, Vector2, Vector3 } from "three";
import Entity from "./Entity";
import { loadModel } from "./GameUtils";
import { Level } from './Level';
import { Player } from "./Player";

export const DEFAULT_MAX_HEALTH = 100;

export class Unit implements Entity {
    health: number;
    owner: Player;
    mesh: Object3D | undefined;
    scene: Scene;
    level: Level;
    readonly MESH_URL:string = '../models/json/human.json';
    readonly objLoader = new THREE.ObjectLoader();

    constructor(owner, scene, level) {
        this.health = DEFAULT_MAX_HEALTH;
        this.owner = owner;
        this.scene = scene;
        this.level = level;
    }

    async start() {
        let mesh;
        await loadModel(this.objLoader, this.MESH_URL).then((obj) => {mesh = obj});
        this.mesh = mesh;
        this.mesh = this.mesh!;
        this.scene.add(this.mesh);

        this.mesh.position.x = 0;
        this.mesh.position.z = 5;
        this.mesh.position.y = 0;
        this.mesh.scale.x = 2;
        this.mesh.scale.y = 2;
        this.mesh.scale.z = 2;
        setTimeout(() => {  this.level.moveObjectToClosestNode(this.mesh); }, 2000);
    }

    getMesh() {
        return this.mesh;
    }

    update() {
        //throw new Error("Method not implemented.");
    }

    takeDamage(rawDamage: number) {
        this.health -= rawDamage;
        if(this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    moveOrder(targetPos: Vector3) {
        if(this.mesh){
            let path = this.level.getPath(this.mesh.position, targetPos);
            console.log("path: " + path);
        }
    }

    die() {

    }

}

export default Unit;