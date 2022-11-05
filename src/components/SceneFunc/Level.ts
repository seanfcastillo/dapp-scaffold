import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { COLLISION_FILTER_LEVEL, COLLISION_FILTER_PHYSICS, loadModel } from "./GameUtils";
import { Pathfinding } from 'three-pathfinding'; 
import { Box3, BoxGeometry, BoxHelper, BufferGeometry, Matrix4, Mesh, MeshBasicMaterial, Scene, SphereGeometry, Vector3 } from "three";
import { group } from "console";
import { Body, Box, Sphere, Vec3, World } from 'cannon-es'
import { Material } from "material/Material";


export class Level {
    levelMesh: GLTF | undefined;
    navMesh: Mesh | undefined;
    scene: Scene;
    pathfinding: Pathfinding;
    readonly LEVEL_MESH_PATH = '../models/glb/level1_unityNavmesh.glb';
    //readonly LEVEL_NAV_MESH_PATH = ;
    readonly ZONE = 'level1';
    colliders: BoxHelper[];
    world: World;
    playerStarts: Vector3[];

    constructor(scene) {
        this.scene = scene;
        // Create level.
        this.pathfinding = new Pathfinding();

        this.colliders = [];

         // physics
         const world = new World({
            gravity: new Vec3(0, -9.82, 0),
        })
        this.world = world;

        this.playerStarts = [];
    }

    async start() {
        const glbLoader = new GLTFLoader();
        let level;
        await loadModel(glbLoader, this.LEVEL_MESH_PATH).then((obj) => {level = obj});
        this.levelMesh = level;
        this.scene.add(level.scene);
        this.levelMesh!.scene.visible = true;

        let navMeshModel: Mesh;
        this.levelMesh!.scene.traverse((node) => {
            if (node instanceof Mesh) {
                if(node.name === "navmesh") {
                    navMeshModel = node;
                    node.material = new MeshBasicMaterial( { color: 0x1F85DE, wireframe: false } );
                    node.material.transparent = true;
                    node.material.opacity = 0.0;
                } else if (node.name.includes(`info_playerstart`)) {
                    let vec = new Vector3();
                    node.getWorldPosition(vec);
                    this.playerStarts.push(vec);
                    let mat = new MeshBasicMaterial({
                        transparent: true,
                        opacity: 0.0
                    });
                    node.material = mat;
                } else {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            }
        });
        console.log(`loader: found ${this.playerStarts.length} playerStarts`);

        this.navMesh = navMeshModel!;

        if(this.navMesh) {
            const navWireframe = new Mesh(this.navMesh.geometry.clone(), new MeshBasicMaterial({
                color: 0xDE1F85,
                wireframe: true,
                transparent: true,
                opacity: 0.0
            }));
            navWireframe.name = "navmesh3";
            navWireframe.geometry.rotateX(Math.PI/2);
            navWireframe.geometry.scale(-1,1,1);
            this.scene.add(navWireframe);
            this.navMesh.geometry.computeBoundingBox();

            const weldThreshold = .0001;//.04;
            let zone = Pathfinding.createZone(navWireframe.geometry, weldThreshold);
            this.pathfinding.setZoneData(this.ZONE, zone);
            this.setupTestSpheres(navWireframe);

            // make a floor
            let bbox = new Box3();
            bbox.setFromObject(this.navMesh);
            let size = new Vector3();
            bbox.getSize(size);
    
            // let levelBody = new Body({
            //     mass: 0,
            //     shape: new Box(new Vec3(size.x/2, size.y/2, size.z/2)),
            //     type: Body.STATIC,
            //     collisionFilterGroup: COLLISION_FILTER_LEVEL
            // })
            // this.world.addBody(levelBody);
            //console.warn(`Level: created a body of id ${levelBody.id}`);
            //levelBody.position.set(this.navMesh.position.x, this.navMesh.position.y, this.navMesh.position.z);
        }
    }
    
    getPath(pointA:Vector3, pointB: Vector3, obj) {
        // Find path from A to B.
        const groupID = this.pathfinding.getGroup(this.ZONE, pointA, true);

        let nodePointA = this.pathfinding.getClosestNode(pointA, this.ZONE, groupID, true);
        let nodePointB = this.pathfinding.getClosestNode(pointB, this.ZONE, groupID, true);
        if(nodePointB !== null) {
            //console.log(`point: (${pointA.x}, ${pointA.y}, ${pointA.z}), (${pointB.x}, ${pointB.y}, ${pointB.z}) `);
            //console.log(nodePointA, nodePointB, this.pathfinding,"zoneId: " + this.ZONE, "groupId: " + groupID);
            console.log(nodePointA? nodePointA.centroid : "pointA node null", nodePointB? nodePointB.centroid : "pointB node null", "zoneId: " + this.ZONE, "groupId: " + groupID);
            if(obj !== null && nodePointA === null) {
                console.log("obj is not on the path. moving to closest node... ");
                this.moveObjectToClosestNode(obj);
                pointA = obj.position;
            }

            let path = this.pathfinding.findPath(pointA, pointB, this.ZONE, groupID);
            console.log(path);
            return path;
        }
        console.warn("destination point not on nav mesh. returning null");
        return null;
    }

    moveObjectToClosestNode(obj: Mesh) {
        const groupID = this.pathfinding.getGroup(this.ZONE, obj.position, true);
        let closestPos  = this.pathfinding.getClosestNode(obj.position, this.ZONE, groupID, true);
        if(closestPos === null) {
            closestPos = this.pathfinding.getClosestNode(obj.position, this.ZONE, groupID, false);
        }
        if(closestPos !== null) {
            obj.position.x = closestPos.centroid.x;
            obj.position.y = closestPos.centroid.y;
            obj.position.z = closestPos.centroid.z;
        } else {
            console.error("fatal error. obj fell completely off and there is no closest node. ");
            obj.position.set(0,0,0);
        }
    }

    addCollider(col) {
        this.colliders.push(col);
    }

    removeCollider(col) {
        let index = this.colliders.indexOf(col);
        if(index > 0) {
            this.colliders.splice(index, 1);    
        }
    }

    getColliders() {
        return this.colliders;
    }

    setupTestSpheres(navWireframe) {
        // const boxGeo = new BoxGeometry(41, .5, 6 );
        // const boxMaterial = new MeshBasicMaterial( { color: 0x843D00 } );
        // const box = new Mesh( boxGeo, boxMaterial );
        // this.scene.add( box );
        // box.geometry.computeBoundingBox();

        let max = navWireframe.localToWorld(navWireframe.geometry.boundingBox!.max);

        const geometry = new SphereGeometry(.25, 32, 16 );
        const material = new MeshBasicMaterial( { color: 0xffff00 } );
        const sphere = new Mesh( geometry, material );
        this.scene.add( sphere );
        sphere.position.set(0, max.y, 0);

        
        const geometry2 = new SphereGeometry( .25, 32, 16 );
        const material2 = new MeshBasicMaterial( { color: 0xffff00 } );
        const sphere2 = new Mesh( geometry2, material2 );
        this.scene.add( sphere2 );
        sphere2.position.y = max.y;
        sphere2.position.x = sphere2.position.x + 6;

        const groupID = this.pathfinding.getGroup(this.ZONE, sphere2.position, true);
        //console.log(`zone: ${zone.vertices.length}`);
        let closestA = this.pathfinding.getClosestNode(sphere.position, this.ZONE, groupID, true);
        let closestB = this.pathfinding.getClosestNode(sphere2.position, this.ZONE, groupID, true);
        console.log(`closest: ${closestA}, ${closestB}`);

        let path = this.pathfinding.findPath(sphere.position, sphere2.position, this.ZONE, groupID);
        console.log(`pure path: ${path}`);
    }
}