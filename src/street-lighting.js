import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// One lighting setup for the playable scene and the architectural review.
export function streetLighting(renderer,scene){
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.04;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();
  scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.36;room.dispose();pmrem.dispose();
  scene.add(new THREE.HemisphereLight('#b7cddd','#807567',.85));
  const sun=new THREE.DirectionalLight('#ffe0b5',2.45);
  sun.position.set(-18,21,20);sun.castShadow=true;sun.shadow.mapSize.set(4096,4096);
  Object.assign(sun.shadow.camera,{left:-30,right:30,top:38,bottom:-38,near:1,far:100});
  sun.shadow.bias=-.0006;sun.shadow.normalBias=.016;sun.shadow.radius=2;
  sun.target.position.set(2,0,-5);scene.add(sun,sun.target);
  return sun;
}
