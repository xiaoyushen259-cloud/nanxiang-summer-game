import * as THREE from 'three';
import {box,rod,wire,cylinder,mesh,group,sign} from './art.js';
import {surfaceBox} from './scenery-detail.js';
import {softBox} from './shop-props.js';

const steel='#465f66',aluminium='#a9b7b2',plaster='#d3c9b8';
const rubber='#33474c';
function bolt(p,x,y,z){cylinder(p,[x,y,z],.014,.014,.012,aluminium,6,false).rotation.x=Math.PI/2;}

export function cornerFinishing(diner,store,ds,cs){
  // Continuous skirting and cappings finish actual edges instead of adding floating trim.
  surfaceBox(diner,[0,.26,-2.125],[6.0,.22,.055],'#647973','brick');
  for(const x of [-2.925,1.125])softBox(diner,[x,.66,1.22],[.052,.82,.50],steel);
  box(diner,[-.90,1.097,1.603],[4.10,.038,.027],'#b89a73',false);
  for(const x of [-2.55,-.90,.75]){
    rod(diner,[x,.36,1.47],[x,.36,1.73],.018,steel);
    for(const y of [.31,.41])bolt(diner,x,y,1.479);
  }
  rod(diner,[-2.78,.36,1.73],[.98,.36,1.73],.025,aluminium);
  ds(-.9,1.33,4.10,.87);
  // Chamfered entrance lintel, jamb and flush metal threshold.
  const entry=group(diner,[2.54,0,1.55],Math.PI/4);
  box(entry,[0,2.79,0],[1.87,.12,.18],steel,false);
  box(entry,[.91,1.485,0],[.11,2.68,.18],steel,false);ds(3.18,.91,.14,.18);
  box(entry,[0,.152,0],[1.72,.014,.31],aluminium,false);
  for(const x of [-.65,-.35,-.05,.25,.55])box(entry,[x,.160,0],[.014,.003,.26],rubber,false);
  // A readable hanging menu belongs to the rear wall, away from food and circulation.
  // Kitchen shelf brackets attach below the shelves, clear of the worktop.
  for(const y of [1.52,2.04])for(const x of [-2.35,-.85,.65]){
    rod(diner,[x,y-.20,-2.13],[x,y-.045,-1.75],.013,steel);
    box(diner,[x,y-.12,-2.13],[.05,.23,.025],steel,false);
  }
  // A fixed end grille makes the extractor a fabricated assembly.
  for(let i=0;i<9;i++)box(diner,[-2.77+i*.29,2.395,-1.28],[.16,.018,.72],'#485e63',false);
  for(const x of [-2.85,-.35])for(const z of [-1.79,-.93])
    cylinder(diner,[x,2.405,z],.012,.012,.01,aluminium,6,false);
  // Terrace slab fascia, drip edge, roof gutter and brackets.
  box(diner,[-.65,3.14,2.217],[5.12,.055,.05],steel,false);
  wire(diner,[[-3.19,5.90,.96],[-3.19,5.90,-1.90],[-3.19,5.69,-2.04],[-3.23,.24,-2.04]],steel,.036);
  for(const y of [.70,2,3.5,5.0])box(diner,[-3.22,y,-2.04],[.12,.046,.12],aluminium,false);
  for(const x of [-2.88,-1.86,-.84,.18,1.20]){
    const beam=box(diner,[x,5.095,1.60],[.055,.10,1.70],steel,false);beam.rotation.x=-.07;
  }
  for(const x of [-1.75,.3]){
    box(diner,[x,3.76,.94],[1.47,.08,.27],plaster,false);
    box(diner,[x,5.26,.88],[1.50,.07,.18],plaster,false);
    box(diner,[x,4.5,.902],[.038,1.42,.047],steel,false);
  }

  // Shopfront rubber seals, ceramic sills and a continuous folded aluminium cornice.
  for(const [x,w] of [[-1.45,2.7],[1.70,1]]){
    box(store,[x,.418,2.745],[w,.025,.12],aluminium,false);
    for(const s of [-1,1])box(store,[x+s*(w/2-.043),1.52,2.728],[.012,2.18,.018],rubber,false);
  }
  const side=group(store,[3.005,0,0],Math.PI/2);
  box(side,[0,.418,0],[5.4,.028,.15],aluminium,false);
  box(store,[0,3.42,3.17],[6.44,.085,.16],steel,false);
  for(const x of [-2.85,-.05,1.18,2.92]){
    rod(store,[x,2.36,2.79],[x,2.645,3.09],.018,steel);
    box(store,[x,2.6475,2.94],[.07,.05,.43],steel,false);
  }
  // Door closer and sill are connected to the opening, not suspended above it.
  softBox(store,[.81,2.70,2.72],[.24,.075,.10],aluminium);
  rod(store,[.91,2.70,2.73],[1.11,2.67,2.39],.011,steel);
  sign(store,'欢迎光临',[.54,2.56,2.744],[.64,.12],{bg:'#344e52',fg:'#eadcbe',border:false});
  for(const x of [.32,.76])rod(store,[x,2.65,2.744],[x,2.78,2.744],.007,aluminium);
  sign(store,'06',[2.91,2.35,2.806],[.17,.22],{bg:'#d6b66d',fg:'#385458',border:false,width:128,height:128});
  // Checkout panels, card terminal and bag hooks add small-scale construction.
  softBox(store,[2.04,.64,1.895],[.88,.74,.035],'#497f77');
  box(store,[2.04,.86,1.919],[.80,.02,.018],steel,false);
  rod(store,[1.89,1.02,1.93],[2.19,1.02,1.93],.012,aluminium);
  softBox(store,[1.74,1.30,1.64],[.17,.06,.22],rubber);
  for(let i=0;i<3;i++)box(store,[1.74,1.334,1.59+i*.047],[.09,.005,.018],aluminium,false);
  // Nested shopping baskets have open sides, bottom support and a separate footprint.
  const baskets=group(store,[2.05,.145,-.7]);
  for(let i=0;i<3;i++){
    const y=.045+i*.12;
    box(baskets,[0,y,0],[.46,.03,.34],'#c1a065',false);
    for(const s of [-1,1]){
      box(baskets,[0,y+.19,s*.17],[.50,.035,.023],'#c1a065',false);
      for(let j=0;j<6;j++)box(baskets,[-.22+j*.088,y+.105,s*.17],[.018,.17,.021],'#c1a065',false);
      box(baskets,[s*.24,y+.105,0],[.02,.17,.34],'#c1a065',false);
    }
  }cs(2.05,-.7,.54,.40);
  // Billboard diagonal bracing and rooftop perimeter curb.
  for(const x of [-1.75,1.25])rod(store,[x,3.49,-1.75],[x,4.88,-1.00],.028,steel);
  for(const z of [-2.72,2.82])box(store,[0,3.58,z],[6.12,.20,.12],plaster,false);
  for(const x of [-2.98,2.98])box(store,[x,3.58,0],[.12,.20,5.56],plaster,false);
}
