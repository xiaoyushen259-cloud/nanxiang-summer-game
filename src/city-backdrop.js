import {box,group,rod} from './art.js';

export function cityBackdrop(root){
  // A stepped far bank, with overlapping mid-rise blocks and a recessed skyline.
  const colors=['#8c9ca5','#b0b5b3','#99a8ad','#b5afa3'];
  for(let i=0;i<13;i++){
    const x=-34+i*5.7,z=-69-(i%3)*4.7,h=7+(i*7%9),w=4.4+(i%3)*.6;
    const b=group(root,[x,0,z]);
    box(b,[0,h/2,0],[w,h,5.7],colors[i%4],false);
    box(b,[0,h+.1,0],[w+.18,.20,5.9],'#7c8b93',false);
    box(b,[-w*.18,h+.7,-.6],[w*.43,1.3,2.5],colors[(i+1)%4],false);
    for(let y=1.7;y<h-.7;y+=1.65){
      for(let j=0;j<3;j++)box(b,[(j-1)*w*.26,y,2.865],[w*.15,.86,.028],'#627e8d',false);
      if(i%2===0)box(b,[0,y-.59,2.91],[w,.09,.10],'#a8b0ad',false);
    }
    if(i%3===0){rod(b,[w*.3,h,0],[w*.3,h+2.4,0],.022,'#687f8a');rod(b,[w*.3-.6,h+1.9,0],[w*.3+.6,h+1.9,0],.017,'#687f8a');}
  }
  for(const [x,z,w,h]of [[-18,-89,8,26],[2,-94,10,31],[21,-88,7,23]]){
    const b=group(root,[x,0,z]);box(b,[0,h/2,0],[w,h,8],'#7e95a6',false);
    for(let y=3;y<h;y+=2.2)box(b,[0,y,4.015],[w*.86,.85,.02],'#92a7b3',false);
    for(const s of [-1,1])box(b,[s*w*.34,h/2,4.035],[.19,h,.04],'#b0babd',false);
  }
}
