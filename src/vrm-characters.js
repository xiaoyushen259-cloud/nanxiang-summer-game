import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '@pixiv/three-vrm';
import {characterAssets} from './character-assets.js';
import {createCharacterMotion,loadMotionLibrary} from './humanoid-motion.js';

const buffers=new Map(),textureSources=new Map();
const loader=new GLTFLoader().register(parser=>new VRMLoaderPlugin(parser));
const materialTextures=mat=>[...Object.values(mat),...Object.values(mat.uniforms??{}).map(u=>u.value)].filter(v=>v?.isTexture);
const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=64;
const shadowContext=shadowCanvas.getContext('2d'),shadowGradient=shadowContext.createRadialGradient(32,32,3,32,32,32);
shadowGradient.addColorStop(0,'rgba(35,39,47,0.32)');shadowGradient.addColorStop(.45,'rgba(35,39,47,0.18)');shadowGradient.addColorStop(1,'rgba(35,39,47,0)');
shadowContext.fillStyle=shadowGradient;shadowContext.fillRect(0,0,64,64);
const contactTexture=new THREE.CanvasTexture(shadowCanvas);
export async function loadCharacters(){
  await Promise.all([loadMotionLibrary(),...[...new Set(Object.values(characterAssets).map(c=>c.file))].map(async file=>{
    const response=await fetch(`${import.meta.env.BASE_URL}models/${file}`);
    if(!response.ok)throw new Error(`角色下载失败：${file} (${response.status})`);
    buffers.set(file,await response.arrayBuffer());
  })]);
}

// Every actor has a separate VRM humanoid, spring simulation and facial binds.
// Only the immutable image sources are shared between copies of the same asset.
async function shareImages(gltf,file){
  const textures=await gltf.parser.getDependencies('texture'),replacements=new Map();
  textures.forEach((texture,index)=>{
    if(!texture)return;
    const key=`${file}:${index}`;
    if(!textureSources.has(key))textureSources.set(key,texture.source);
    replacements.set(texture.source,textureSources.get(key));
  });
  gltf.scene.traverse(object=>{
    if(!object.isMesh)return;
    for(const mat of [object.material].flat())for(const value of materialTextures(mat)){
      if(replacements.has(value.source))value.source=replacements.get(value.source);
    }
  });
}

export async function createCharacter(scene,{x=0,z=0,yaw=0,scale=1,name='小夏',variant='courier'}={}){
  const config=characterAssets[variant];
  if(!config||!buffers.has(config.file))throw new Error(`未准备角色：${variant}`);
  const gltf=await loader.parseAsync(buffers.get(config.file),'');
  await shareImages(gltf,config.file);
  const vrm=gltf.userData.vrm;
  if(!vrm)throw new Error(`缺少 VRM 骨骼信息：${config.file}`);
  VRMUtils.rotateVRM0(vrm);VRMUtils.combineSkeletons(vrm.scene);
  const root=new THREE.Group(),fit=new THREE.Group(),model=vrm.scene;
  root.name=name;
  root.add(fit);fit.add(model);
  const materials=new Set();
  model.traverse(object=>{
    if(!object.isMesh)return;
    object.castShadow=true;
    // World shadow bias is sized for buildings; it must not erase facial detail.
    object.receiveShadow=true;object.frustumCulled=false;
    for(const mat of [object.material].flat()){
      materials.add(mat);
      if(mat.isMToonMaterial){
        mat.outlineWidthFactor=Math.min(mat.outlineWidthFactor,.0012);
        mat.outlineColorFactor.set('#524c50');
        mat.parametricRimColorFactor.setRGB(0,0,0);mat.matcapFactor.setRGB(0,0,0);
        mat.rimMultiplyTexture=null;mat.matcapTexture=null;
        mat.shadingToonyFactor=.85;mat.giEqualizationFactor=.75;
        mat.shadeColorFactor.lerp(mat.color,.28);
      }
    }
  });
  // Measure the neutral rig, not a randomly selected, bent-knee idle frame.
  vrm.update(0);root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model,true),nativeHeight=bounds.max.y-bounds.min.y;
  if(!Number.isFinite(nativeHeight)||nativeHeight<=0)throw new Error('人物尺寸无效');
  const factor=config.height/nativeHeight;
  fit.scale.setScalar(factor);
  fit.position.set(-(bounds.min.x+bounds.max.x)*factor/2,-bounds.min.y*factor,-(bounds.min.z+bounds.max.z)*factor/2);
  root.updateMatrixWorld(true);
  const leftFoot=vrm.humanoid.getRawBoneNode('leftFoot'),rightFoot=vrm.humanoid.getRawBoneNode('rightFoot');
  const left=new THREE.Vector3(),right=new THREE.Vector3();
  function ankleHeight(){leftFoot.getWorldPosition(left);rightFoot.getWorldPosition(right);return Math.min(root.worldToLocal(left).y,root.worldToLocal(right).y);}
  const contactPoint=new THREE.Vector3();
  const soles=[leftFoot,rightFoot].flatMap(foot=>{
    const position=foot.getWorldPosition(new THREE.Vector3());
    return [-.04,.115].map(z=>({foot,point:foot.worldToLocal(new THREE.Vector3(position.x,0,position.z+z))}));
  });
  function soleHeight(){let height=Infinity;for(const s of soles){contactPoint.copy(s.point);s.foot.localToWorld(contactPoint);height=Math.min(height,root.worldToLocal(contactPoint).y);}return height;}
  const motion=createCharacterMotion(vrm,config);
  root.position.set(x,0,z);root.rotation.y=yaw;root.scale.setScalar(scale);scene.add(root);
  motion.update(0,0);vrm.update(0);root.updateMatrixWorld(true);vrm.springBoneManager?.reset();
  const lastRootPosition=root.position.clone();
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(.72,.55),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
  contact.rotation.x=-Math.PI/2;contact.position.y=.012;root.add(contact);
  let blinkClock=0,nextBlink=1.4+Math.random()*3,blink=0,talkAmount=0;
  const phase=Math.random()*Math.PI*2;
  return {root,model,vrm,name,bones:motion.bones,mixer:motion.mixer,actions:motion.actions,asset:config.label,
    update(dt,speed=0,{speaking=false,grounded=true,elevation=0,attentive=false}={}){
      motion.update(dt,speed,{speaking,grounded,attentive});blinkClock+=dt;
      if(blinkClock>=nextBlink){blinkClock=0;nextBlink=2.8+Math.random()*3;blink=.18;}
      blink=Math.max(0,blink-dt);
      vrm.expressionManager.setValue('blink',blink>0?Math.sin(blink/.18*Math.PI):0);
      talkAmount=THREE.MathUtils.damp(talkAmount,speaking?1:0,7,dt);
      vrm.expressionManager.setValue('happy',talkAmount*.08);
      vrm.expressionManager.setValue('aa',talkAmount*Math.max(0,Math.sin(motion.time*3+phase))*.045);
      root.updateMatrixWorld(true);
      if(lastRootPosition.distanceToSquared(root.position)>.5)vrm.springBoneManager?.reset();
      lastRootPosition.copy(root.position);
      vrm.update(dt);root.updateMatrixWorld(true);
      // Ground the heel/toe contact, allowing the ankle to roll naturally above it.
      // Ankle-height clamping lifted the whole body during heel strike.
      if(grounded){fit.position.y-=THREE.MathUtils.clamp(soleHeight(),-.15,.15);root.updateMatrixWorld(true);}
      ankleHeight();
      contact.position.set((left.x+right.x)/2,.012-elevation,(left.z+right.z)/2);
      contact.material.opacity=Math.max(.25,1-elevation*.6);
    },
    get diagnostics(){return {asset:config.label,animation:motion.active,pose:motion.pose,activity:false,hipHeight:root.worldToLocal(vrm.humanoid.getRawBoneNode('hips').getWorldPosition(new THREE.Vector3())).y,leftWrist:root.worldToLocal(vrm.humanoid.getRawBoneNode('leftHand').getWorldPosition(new THREE.Vector3())).toArray(),rightWrist:root.worldToLocal(vrm.humanoid.getRawBoneNode('rightHand').getWorldPosition(new THREE.Vector3())).toArray(),head:motion.bones.head.quaternion.toArray(),leftArm:motion.bones.leftUpperArm.quaternion.toArray(),rightArm:motion.bones.rightUpperArm.quaternion.toArray(),idlePhase:motion.phase,handsBelowHips:['leftHand','rightHand'].every(name=>vrm.humanoid.getRawBoneNode(name).getWorldPosition(new THREE.Vector3()).y<vrm.humanoid.getRawBoneNode('hips').getWorldPosition(new THREE.Vector3()).y),blink:vrm.expressionManager.getValue('blink'),mouth:vrm.expressionManager.getValue('aa'),leftLeg:motion.bones.leftUpperLeg.quaternion.toArray(),rightLeg:motion.bones.rightUpperLeg.quaternion.toArray(),height:config.height*scale,footError:soleHeight(),rig:motion.bones.hips.uuid,textureSources:[...new Set([...materials].flatMap(mat=>materialTextures(mat).map(t=>t.source.uuid)))]};},
    dispose(){motion.mixer.stopAllAction();motion.mixer.uncacheRoot(model);materials.forEach(m=>m.dispose());scene.remove(root);}
  };
}
