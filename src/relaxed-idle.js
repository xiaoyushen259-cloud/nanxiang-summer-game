// RETIRED EXPERIMENT: not imported by the game. Wrist/prop contact was unreliable.
import * as THREE from 'three';

// Purposeful 16-second activities: sustained work, a second action, then a glance.
// Two-bone arm solving keeps wrist targets coordinated across different VRM rigs.
export function relaxedIdle(vrm,base,label,profile=0){
  const bones=vrm.humanoid,duration=16,steps=256,times=Array.from({length:steps+1},(_,i)=>i/steps*duration);
  const tracks=[],replaced=new Set(),forward=vrm.meta.metaVersion==='0'?-1:1;
  const track=(name,pose)=>{
    const bone=bones.getNormalizedBoneNode(name);if(!bone)return;
    const values=[];for(const t of times)values.push(...pose(t/duration*Math.PI*2).toArray());
    tracks.push(new THREE.QuaternionKeyframeTrack(`${bone.uuid}.quaternion`,times,values));replaced.add(`${bone.uuid}.quaternion`);
  };
  const rotation=(x=0,y=0,z=0)=>new THREE.Quaternion().setFromEuler(new THREE.Euler(x,y,z,'YXZ'));
  const smooth=x=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*(3-2*x)};
  const beat=(t,a,b,c,d)=>smooth((t-a)/(b-a))*(1-smooth((t-c)/(d-c)));
  const sec=t=>t/Math.PI/2*duration;
  const a=t=>beat(sec(t),.3,1.5,4.7,5.8),b=t=>beat(sec(t),6.2,7.3,10.4,11.6),c=t=>beat(sec(t),12,13,14.6,16);
  const working=[1,2,3,4].includes(profile),shift=t=>Math.sin(t)*.04+Math.sin(t*2)*.014;
  const lean=[-.016,.014,-.012,.012,-.008,.012][profile%6];
  track('hips',t=>rotation(0,Math.sin(t)*.028,lean+shift(t)));
  track('spine',t=>rotation((working?.035:.012)*forward+Math.sin(t*2)*.012,Math.sin(t)*.018,-lean*.45-shift(t)*.65));
  track('chest',t=>rotation(.018*forward+Math.sin(t*4)*.008,Math.sin(t)*-.035,-lean*.35-shift(t)*.2));
  track('upperChest',t=>rotation(Math.sin(t*4)*.007));
  track('neck',()=>rotation(.015*forward));
  track('head',t=>rotation((working?.15*(1-c(t)):.03+a(t)*.10)*forward+(label==='Talk'?Math.sin(t*8)*.04:Math.sin(t*3)*.015),(.035*Math.sin(t)+c(t)*(profile%2?-.34:.34))*forward,.025*Math.sin(t*2)));
  vrm.scene.updateMatrixWorld(true);
  const local=bone=>vrm.scene.worldToLocal(bone.getWorldPosition(new THREE.Vector3()));
  const hipRest=local(bones.getNormalizedBoneNode('hips'));
  const shoulderRest=local(bones.getNormalizedBoneNode('leftUpperArm'));
  const unit=(shoulderRest.y-hipRest.y)/.47;
  const leftSign=Math.sign(bones.getNormalizedBoneNode('leftLowerArm').position.x)||1;
  for(const side of ['left','right']){
    const upper=bones.getNormalizedBoneNode(side+'UpperArm'),lower=bones.getNormalizedBoneNode(side+'LowerArm'),hand=bones.getNormalizedBoneNode(side+'Hand');
    if(upper&&lower&&hand){
      const armDirection=lower.position.clone().normalize(),handDirection=hand.position.clone().normalize(),sign=Math.sign(armDirection.x)||1;
      const shoulder=local(upper),l1=lower.position.length(),l2=hand.position.length();
      const restParentQ=vrm.scene.getWorldQuaternion(new THREE.Quaternion()).invert().multiply(upper.parent.getWorldQuaternion(new THREE.Quaternion())).invert();
      const left=side==='left';
      track(side+'Shoulder',t=>rotation(0,Math.sin(t*2)*.008,Math.sin(t*3)*.008));
      const target=t=>{
        let x=sign*.23,y=-.27,z=.045;
        const wave=Math.sin(t*12),circle=Math.cos(t*12),A=a(t),B=b(t),C=c(t);
        if(profile===1){ // Clipboard held continuously; right hand checks and writes.
          x=left?leftSign*.10:leftSign*(.04+.025*wave);y=left?.21:.28+.015*circle;z=left?.30:.35+.025*wave;
          if(!left){x+=sign*.12*B;y+=.10*B;z-=.025*B;}
        }else if(profile===2){ // Cradle a bowl; stir, inspect, and continue working.
          x=left?leftSign*.10:leftSign*(.06+.035*wave);y=left?.16:.29+.022*circle;z=left?.34:.36+.035*circle;
          if(!left){x+=sign*.14*B;y+=.12*B;z-=.015*B;}
        }else if(profile===3){ // Open book, trace a line and turn a page.
          x=sign*.14;y=.20+(left?0:.04*B);z=.34;
          if(!left){x-=sign*.22*B;z+=.035*B;}
        }else if(profile===4){ // Phone: scroll/tap, briefly move free hand to chin.
          x=left?leftSign*.10:leftSign*.03;y=left?.33:.34+.013*wave;z=left?.31:.35+.016*circle;
          if(!left){x=THREE.MathUtils.lerp(x,-sign*.03,B);y+=.17*B;z-=.16*B;}
        }else if(profile===0){
          // Courier: adjust sleeve, loosen shoulder, then glance over the street.
          if(left){x+=(-sign*.14-x)*A;y+=.53*A;z+=.29*A;}
          else{x+=(-sign*.12-x)*A;y+=.58*A;z+=.31*A;}
          x+=sign*.14*B;y+=.24*B;z-=.10*B;
        }else{
          if(!left){x+=(-sign*.02-x)*A;y+=.90*A;z+=.10*A;}
          else{x+=sign*.04*B;y+=.18*B;z-=.09*B;}
          if(!left){x+=sign*.04*B;y+=.17*B;z-=.06*B;}
        }
        // Continuous small wrist changes and a brief pause to look up.
        x+=sign*.008*Math.sin(t*4);y+=.006*Math.sin(t*4);z-=working?.035*C:0;
        return new THREE.Vector3(x*unit,hipRest.y+y*unit,hipRest.z+z*unit*forward).sub(shoulder).applyQuaternion(restParentQ);
      };
      const solve=t=>{
        const delta=target(t),distance=THREE.MathUtils.clamp(delta.length(),Math.abs(l1-l2)+.002,l1+l2-.005),direction=delta.normalize();
        const along=(l1*l1-l2*l2+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,l1*l1-along*along));
        const pole=new THREE.Vector3(sign*.30,-1,-.12*forward).applyQuaternion(restParentQ);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
        const elbow=direction.clone().multiplyScalar(along).addScaledVector(pole,height);
        const q=new THREE.Quaternion().setFromUnitVectors(armDirection,elbow.clone().normalize());
        const fore=direction.multiplyScalar(distance).sub(elbow).normalize().applyQuaternion(q.clone().invert());
        return [q,new THREE.Quaternion().setFromUnitVectors(handDirection,fore)];
      };
      track(side+'UpperArm',t=>solve(t)[0]);track(side+'LowerArm',t=>solve(t)[1]);
      track(side+'Hand',t=>{
        if(!working)return rotation(0,0,sign*.02);
        const [up,low]=solve(t),parent=up.clone().multiply(low);
        let direction=new THREE.Vector3(0,.75,forward*.65),normal=new THREE.Vector3(0,0,-forward);
        if(profile===2&&left){direction.set(0,0,forward);normal.set(0,1,0);}
        else if((profile===1||profile===2)&&!left){direction.set(0,-.9,forward*.3);normal.set(-sign,0,0);}
        else if(profile===3){direction.set(-sign*.35,.2,forward*.85);normal.set(0,1,-forward*.2);}
        direction.normalize().applyQuaternion(restParentQ);normal.applyQuaternion(restParentQ);
        const desired=new THREE.Quaternion().setFromUnitVectors(armDirection,direction);
        const palm=new THREE.Vector3(0,-1,0).applyQuaternion(desired);normal.addScaledVector(direction,-normal.dot(direction)).normalize();
        const roll=Math.atan2(direction.dot(palm.clone().cross(normal)),palm.dot(normal));
        desired.premultiply(new THREE.Quaternion().setFromAxisAngle(direction,roll));
        return parent.invert().multiply(desired);
      });
      if(working)for(const finger of ['Index','Middle','Ring','Little'])for(const [segment,curl] of [['Proximal',.22],['Intermediate',.4],['Distal',.24]])track(side+finger+segment,()=>rotation(0,0,-sign*curl));
    }
    const leg=bones.getNormalizedBoneNode(side+'UpperLeg'),sgn=Math.sign(leg?.position.x??0);
    track(side+'UpperLeg',t=>rotation(-.018*forward,0,sgn*.045-shift(t)*.16));
    track(side+'LowerLeg',t=>rotation((.038+.018*(1+Math.sin(t+(side==='left'?0:Math.PI))))*forward));
    track(side+'Foot',t=>rotation(-.014*forward,0,shift(t)*.10));track(side+'Toes',()=>rotation());
  }
  const hips=bones.getNormalizedBoneNode('hips'),positions=[];
  for(const t of times)positions.push(hips.position.x+Math.sin(t/duration*Math.PI*2)*.018,hips.position.y+Math.sin(t/duration*Math.PI*4)*.003,hips.position.z);
  const hipTrack=`${hips.uuid}.position`;tracks.push(new THREE.VectorKeyframeTrack(hipTrack,times,positions));replaced.add(hipTrack);
  // Preserve a softened version of the source's finger curl, instead of a flat palm.
  const identity=new THREE.Quaternion(),q=new THREE.Quaternion();
  for(const source of base.tracks){
    if(replaced.has(source.name))continue;
    const copy=source.clone();
    if(copy.ValueTypeName==='quaternion')for(let i=0;i<copy.values.length;i+=4){q.fromArray(copy.values,i).slerp(identity,.4).toArray(copy.values,i);}
    // Repeat the relaxed finger pose without importing source body gestures.
    tracks.push(copy);
  }
  return new THREE.AnimationClip(label,duration,tracks);
}
