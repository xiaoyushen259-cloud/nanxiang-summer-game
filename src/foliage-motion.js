import * as THREE from 'three';
const time={value:0},depths=new WeakMap();
const sway=`
float breeze=sin(treeTime*.72+position.x*.85+position.z*.61);
float flutter=sin(treeTime*1.6+position.x*8.+position.z*6.);
transformed.x+=breeze*.018+flutter*.004;
transformed.z+=breeze*.009;
transformed.y+=flutter*.003;
`;
function patch(shader){shader.uniforms.treeTime=time;shader.vertexShader='uniform float treeTime;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+sway);}
export function prepareFoliage(material){
  material.userData.foliage=true;material.roughness=.86;
  material.emissive.set('#586638');material.emissiveIntensity=.10;
  material.onBeforeCompile=patch;material.customProgramCacheKey=()=> 'nanxiang-leaf-breeze-v1';
}
export function foliageDepth(material){
  if(!depths.has(material)){const depth=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,side:THREE.DoubleSide});depth.onBeforeCompile=patch;depth.customProgramCacheKey=()=> 'nanxiang-leaf-depth-v1';depths.set(material,depth);}
  return depths.get(material);
}
export function updateFoliage(seconds){time.value=seconds;}
