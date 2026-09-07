// RETIRED EXPERIMENT: not imported by the game. Wrist/prop contact was unreliable.
import * as THREE from 'three';
import {box,mesh,rod,group} from './art.js';
import {softBox,printedCard,bowl} from './shop-props.js';

// Props follow the solved wrists after humanoid and grounding updates.
// They are local to each actor, so they follow world bending and turning together.
export function characterActivity(root,vrm,profile){
  const g=group(root),tool=group(root),left=new THREE.Vector3(),right=new THREE.Vector3(),finger=new THREE.Vector3();
  let turningPage;
  if(profile===1){
    softBox(g,[0,0,0],[.19,.25,.015],'#455e68');
    printedCard(g,[0,0,.009],.17,.22,11);box(g,[0,.12,.014],[.06,.024,.015],'#9ba6a9',false);
    rod(tool,[0,-.045,0],[0,.045,0],.004,'#263d49');
  }else if(profile===2){
    bowl(g,[0,0,0],1,false).scale.setScalar(1.3);
    for(const x of [-.006,.006])rod(tool,[x,-.045,0],[x,.065,0],.0028,'#704329');
  }else if(profile===3){
    for(const sign of [-1,1]){
      const page=group(g,[sign*.082,0,0]);page.rotation.y=sign*.24;
      box(page,[0,0,0],[.165,.21,.018],'#695776',false);
      printedCard(page,[0,0,.011],.153,.195,sign===1?10:1);
    }
    turningPage=group(g);printedCard(turningPage,[.082,0,.027],.153,.195,10);
  }else if(profile===4){
    softBox(g,[0,0,0],[.073,.14,.012],'#28313e');
    const screen=mesh(g,new THREE.PlaneGeometry(.061,.117),new THREE.MeshBasicMaterial({color:'#9ecaca'}),[0,0,.007],false);
    for(let i=0;i<4;i++)box(g,[-.006,.031-i*.023,.008],[.044,.008,.001],i%2?'#f1e9cf':'#517b85',false);
    screen.castShadow=false;
  }
  const supported=[1,2,3,4].includes(profile);
  return {
    update(active,phase){
      g.visible=supported&&['Idle','Talk'].includes(active);tool.visible=g.visible&&[1,2].includes(profile);
      if(!g.visible)return;
      root.worldToLocal(vrm.humanoid.getRawBoneNode('leftHand').getWorldPosition(left));
      root.worldToLocal(vrm.humanoid.getRawBoneNode('rightHand').getWorldPosition(right));
      for(const [side,point] of [['left',left],['right',right]]){const bone=vrm.humanoid.getRawBoneNode(side+'MiddleProximal');if(bone){root.worldToLocal(bone.getWorldPosition(finger));point.lerp(finger,.65);}}
      if(profile===3){g.position.copy(left);g.position.x-=.13;g.position.z+=.025;g.rotation.set(-.55,Math.PI,0);const t=(phase%16);const turn=t<6.2?0:t<10.4?Math.min(1,(t-6.2)/2.2):Math.max(0,1-(t-10.4)/1.2);turningPage.rotation.y=-Math.PI*turn;}
      else if(profile===2){g.position.copy(left);g.position.y+=.012;tool.position.copy(right);tool.rotation.z=.12;}
      else {g.position.copy(left);g.position.y+=.055;g.position.z+=.022;g.rotation.set(-.32,Math.PI,0);tool.position.copy(right);tool.rotation.z=.25;}
    },
    get visible(){return g.visible},
    dispose(){for(const parent of [g,tool])root.remove(parent)}
  };
}
