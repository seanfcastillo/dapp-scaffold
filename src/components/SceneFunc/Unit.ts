import * as THREE from 'three'
import { Object3D, Scene } from "three";
import Entity from "./Entity";
import { loadModelAndAddToScene } from "./GameUtils";
import { Player } from "./Player";

export const DEFAULT_MAX_HEALTH = 100;

export class Unit implements Entity {
    health: number;
    owner: Player;
    mesh: Object3D | undefined;
    scene: Scene;
    readonly MESH_URL:string = '../models/json/human.json';
    readonly objLoader = new THREE.ObjectLoader();

    constructor(owner, scene) {
        this.health = DEFAULT_MAX_HEALTH;
        this.owner = owner;
        this.scene = scene;
        //this.start();
    }

    async start() {
        
        let mesh;
        await loadModelAndAddToScene(this.objLoader, this.MESH_URL).then((obj) => {mesh = obj});
        this.mesh = mesh;
        this.mesh = this.mesh!;
        this.scene.add(this.mesh);

        this.mesh.position.x = 0;
        this.mesh.position.z = 10;
        this.mesh.position.y = 5;
        this.mesh.scale.x = 2;
        this.mesh.scale.y = 2;
        this.mesh.scale.z = 2;
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

    moveOrder(gridX, gridY) {
        
    }

    die() {

    }

}

export default Unit;