import * as THREE from 'three'
import { Camera, Object3D, ObjectLoader, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { GLTF, GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export async function loadModel(loader: GLTFLoader|ObjectLoader, path: string): Promise<GLTF|Object3D> {
    return await loader.loadAsync(path);
  }


export function drawCircle(radius, segmentCount): THREE.Line {
    var geometry = new THREE.BufferGeometry();
    const material = new THREE.LineBasicMaterial({ color: 0x00FF5D });

    let points: THREE.Vector3[] = [];
    for (var i = 0; i <= segmentCount; i++) {
        var theta = (i / segmentCount) * Math.PI * 2;
        points.push(
            new THREE.Vector3(
                Math.cos(theta) * radius,
                Math.sin(theta) * radius,
                0));            
    }
    geometry.setFromPoints(points);
    return new THREE.Line(geometry, material);
}

export interface PlayerProps {
    camera: PerspectiveCamera;
    canvas: WebGLRenderer;
    mainDiv: HTMLDivElement|null;
    scene: Scene;
}