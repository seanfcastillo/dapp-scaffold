import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { loadModel } from "./GameUtils";
import { Pathfinding } from 'three-pathfinding'; 
import { Mesh, MeshBasicMaterial, Scene, SphereGeometry, Vector3 } from "three";
import { group } from "console";

export class Level {
    levelMesh: GLTF | undefined;
    navMesh: GLTF | undefined;
    scene: Scene;
    pathfinding: Pathfinding;
    readonly LEVEL_MESH_PATH = '../models/glb/level1.glb';
    readonly LEVEL_NAV_MESH_PATH = '../models/glb/level1_nav.glb';
    readonly ZONE = 'level1';

    constructor(scene) {
        this.scene = scene;
        // Create level.
        this.pathfinding = new Pathfinding();

        this.start();
    }

    async start() {
        const glbLoader = new GLTFLoader();
        let level;
        await loadModel(glbLoader, this.LEVEL_MESH_PATH).then((obj) => {level = obj});
        this.levelMesh = level;
        this.scene.add(level.scene);
        this.levelMesh!.scene.position.x = 35;
        this.levelMesh!.scene.position.z = 5;
        this.levelMesh!.scene.position.y = 0;
        this.levelMesh!.scene.visible = true;

        let navMeshLoaded;
        await loadModel(glbLoader, this.LEVEL_NAV_MESH_PATH).then((obj) => {navMeshLoaded = obj});
        this.navMesh = navMeshLoaded;
        if(!this.navMesh) {
            throw new Error("navmesh not loaded");
        }

        if(this.navMesh) {
            //this.scene.add(this.navMesh.scene);
            this.navMesh.scene.position.x = this.levelMesh!.scene.position.x;
            this.navMesh.scene.position.z = this.levelMesh!.scene.position.z;
            this.navMesh.scene.position.y = this.levelMesh!.scene.position.y;
            this.navMesh.scene.visible = false;
            //this.navMesh.scene.scale.y = 125;

            let navMeshModel;
            // this.navMesh.scene.traverse((node) => {
            //     if (node instanceof Mesh) navMeshModel = node;
            //     node.position.y = this.navMesh?.scene.position.y??0; // this is probably not needed. keeping child object in sync with parent just in case
            // });

            this.navMesh!.scene.traverse((node) => {
                if (node instanceof Mesh) navMeshModel = node;
                node.position.y = this.navMesh?.scene.position.y??0; // this is probably not needed. keeping child object in sync with parent just in case
            });
            const navWireframe = new Mesh((navMeshModel as THREE.Mesh).geometry, new MeshBasicMaterial({
                color: 0x808080,
                wireframe: true
            }));
            this.scene.add(navWireframe);
            navWireframe.position.x = this.levelMesh!.scene.position.x;
            navWireframe.position.z = this.levelMesh!.scene.position.z;
            navWireframe.position.y = this.levelMesh!.scene.position.y + .2;
            const scalar = 1;
            navWireframe.scale.x = 41.322*scalar;
            navWireframe.scale.y = .03*scalar;
            navWireframe.scale.z = 6*scalar;
            navWireframe.visible = true;

            let zone = Pathfinding.createZone((navMeshModel as THREE.Mesh).geometry, 0.0001);
            
            this.pathfinding.setZoneData(this.ZONE, zone);


            const geometry = new SphereGeometry(.25, 32, 16 );
            const material = new MeshBasicMaterial( { color: 0xffff00 } );
            const sphere = new Mesh( geometry, material );
            this.scene.add( sphere );
            sphere.position.y = navWireframe.position.y+0;

            const geometry2 = new SphereGeometry( .25, 32, 16 );
            const material2 = new MeshBasicMaterial( { color: 0xffff00 } );
            const sphere2 = new Mesh( geometry2, material2 );
            this.scene.add( sphere2 );
            sphere2.position.y = navWireframe.position.y;
            sphere2.position.x = sphere2.position.x + 6;

            const groupID = this.pathfinding.getGroup(this.ZONE, sphere2.position, true);
            //console.log(`zone: ${zone.vertices.length}`);
            let closestA = this.pathfinding.getClosestNode(sphere.position, this.ZONE, groupID, true)
            let closestB = this.pathfinding.getClosestNode(sphere2.position, this.ZONE, groupID, true)
            console.log(`closest: ${closestA}, ${closestB}`);

            let path = this.pathfinding.findPath(sphere.position, sphere2.position, this.ZONE, groupID);
            console.log(`pure path: ${path}`);
        }
    }

    getPath(pointA:Vector3, pointB: Vector3) {
        // Find path from A to B.
        // 
        pointA = new Vector3(pointA.x, 0.2, pointA.z);
        pointB = new Vector3(pointB.x, 0.2, pointB.z);
        const groupID = this.pathfinding.getGroup(this.ZONE, pointA, true);
        let nodePointA: Vector3  = this.pathfinding.getClosestNode(pointA, this.ZONE, groupID, true);
        let bodePointB: Vector3 = this.pathfinding.getClosestNode(pointB, this.ZONE, groupID, true);
    

        pointB = new Vector3(pointB.x, 0, pointB.z);
        console.log(`point: (${pointA.x}, ${pointA.y}, ${pointA.z}), (${pointB.x}, ${pointB.y}, ${pointB.z}) `);
        console.log(nodePointA, bodePointB, this.pathfinding,"zoneId: " + this.ZONE, "groupId: " + groupID);
        let path = this.pathfinding.findPath(pointA, pointB, this.ZONE, groupID);
        console.log(path);
        return path;
    }

    moveObjectToClosestNode(obj) {
        const groupID = this.pathfinding.getGroup(this.ZONE, obj.position, true);
        let closestPos  = this.pathfinding.getClosestNode(obj.position, this.ZONE, groupID, false);
        obj.position.x = closestPos.x;
        obj.position.y = closestPos.y;
        obj.position.z = closestPos.z;
    }

    // getClosestNode (position, zoneID, groupID, checkPolygon = false) {
	// 	const nodes = this.zones[zoneID].groups[groupID];
	// 	const vertices = this.zones[zoneID].vertices;
	// 	let closestNode = null;
	// 	let closestDistance = Infinity;

	// 	nodes.forEach((node) => {
	// 		const distance = Utils.distanceToSquared(node.centroid, position);
	// 		if (distance < closestDistance
	// 				&& (!checkPolygon || Utils.isVectorInPolygon(position, node, vertices))) {
	// 			closestNode = node;
	// 			closestDistance = distance;
	// 		}
	// 	});

	// 	return closestNode;
	// }
}