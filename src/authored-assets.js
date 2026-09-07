import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {prepareFoliage,foliageDepth} from './foliage-motion.js';
import {shopGraphic} from './shop-graphics.js';
import {streetSurfaceMaps} from './street-surfaces.js';

const names=['Bicycle','Planter','BookSign','BookDisplay','DinerUpper','StoreCrown','TeaTin','DrinkCarton','SnackBag','DeliveryVan','TeaSign','SoupSign','StreetTree'];
const templates=new Map();
let loading;
export function loadAuthoredAssets(){
  return loading??=Promise.all(names.map(async name=>{
    const {scene}=await new GLTFLoader().loadAsync(`/models/neighborhood-v1/${name}.glb`);
    scene.traverse(o=>{if(o.isMesh){
      o.castShadow=o.receiveShadow=true;
      if(o.material.name==='NX_RestaurantWide')o.material.map=shopGraphic('fascia');
      if(['NX_RedPlaster','NX_IvoryConcrete'].includes(o.material.name)){
        const maps=streetSurfaceMaps('plaster');
        o.material.map??=maps.map;o.material.bumpMap=maps.bumpMap;
        o.material.roughnessMap=maps.roughnessMap;o.material.bumpScale=.003;o.material.roughness=.94;
      }
      if(o.material.map)o.material.map.anisotropy=8;
      if(o.material.name.startsWith('NX_TreeLeaves')){prepareFoliage(o.material);o.customDepthMaterial=foliageDepth(o.material);}
    }});
    templates.set(name,scene);
  }));
}
export function authoredAsset(name){return templates.get(name)?.clone(true);}

// Remove the old upper meshes in building-local space before adding the authored
// module. Ground-floor interiors and their existing navigation remain in place.
export function replaceBuildingTop(building,name,height){
  const asset=authoredAsset(name);if(!asset)return;
  building.updateWorldMatrix(true,true);
  const inverse=building.matrixWorld.clone().invert(),retired=[];
  building.traverse(o=>{
    if(!o.isMesh)return;
    o.geometry.computeBoundingBox();
    const b=o.geometry.boundingBox.clone().applyMatrix4(inverse.clone().multiply(o.matrixWorld));
    if(b.min.y>=height-.025||(name==='DinerUpper'&&b.max.y>6.7))retired.push(o);
  });
  retired.forEach(o=>o.removeFromParent());
  asset.position.y=height;building.add(asset);
}
