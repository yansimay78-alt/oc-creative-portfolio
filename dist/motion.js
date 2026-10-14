// GSAP-driven motion for the portfolio only. carousel-lamp remains unmodified.
export function initMotion(){
 const g=window.gsap,ST=window.ScrollTrigger;
 if(!g||!ST)return {refresh(){}};
 g.registerPlugin(ST);
 const mm=g.matchMedia(),main=document.querySelector('#main-page');
 mm.add('(prefers-reduced-motion: no-preference)',()=>{
  const hero=document.querySelector('.hero');
  g.from('.hero-copy > *',{y:24,opacity:0,stagger:.12,duration:1.15,ease:'power3.out',clearProps:'transform,opacity'});
  g.to('.hero-background',{yPercent:12,ease:'none',scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:1}});
  document.querySelectorAll('.chapter-bridge').forEach(bridge=>{
   g.fromTo(bridge.querySelector('p'),{x:40,opacity:.2},{x:-20,opacity:1,ease:'none',scrollTrigger:{trigger:bridge,start:'top 92%',end:'bottom 30%',scrub:1.2}});
   g.fromTo(bridge.querySelector('path'),{strokeDashoffset:1},{strokeDashoffset:0,ease:'none',scrollTrigger:{trigger:bridge,start:'top 95%',end:'bottom 35%',scrub:.7}});
   g.to(bridge.querySelector('i'),{rotation:90,ease:'none',scrollTrigger:{trigger:bridge,start:'top bottom',end:'bottom top',scrub:1}});
  });
  document.querySelectorAll('.project-visual').forEach(visual=>{g.fromTo(visual,{scale:.96},{scale:1,ease:'none',scrollTrigger:{trigger:visual,start:'top 95%',end:'top 35%',scrub:.8}})});
  g.fromTo('.record-entry-art',{y:35,rotation:-5},{y:-20,rotation:0,ease:'none',scrollTrigger:{trigger:'.record-entry',start:'top bottom',end:'bottom 35%',scrub:1}});

 });
 mm.add('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',()=>{
  const hero=document.querySelector('.hero'),bg=hero.querySelector('.hero-background'),piano=hero.querySelector('.piano-distance'),composition=document.querySelector('.portrait-composition');
  const quick=(el,prop)=>g.quickTo(el,prop,{duration:.85,ease:'power3.out'});
  g.set(bg,{transformPerspective:1100,scale:1.07,transformOrigin:'50% 50%'});
  const bx=quick(bg,'x'),by=quick(bg,'y'),brx=quick(bg,'rotationX'),bry=quick(bg,'rotationY'),px=quick(piano,'x'),py=quick(piano,'y');
  let heroRect=hero.getBoundingClientRect(),cardRect;
  const measure=()=>{heroRect=hero.getBoundingClientRect();cardRect=composition.getBoundingClientRect()};
  const heroMove=e=>{if(e.pointerType!=='mouse'||main.hidden)return;const x=Math.max(-.5,Math.min(.5,(e.clientX-heroRect.left)/heroRect.width-.5)),y=Math.max(-.5,Math.min(.5,(e.clientY-heroRect.top)/heroRect.height-.5));bx(-x*48);by(-y*34);brx(y*5);bry(-x*6);px(x*24);py(y*16)};
  const heroReset=()=>{bx(0);by(0);brx(0);bry(0);px(0);py(0)};
  const layers=[...composition.querySelectorAll('.photo-slice,.portrait,.pencil-star,.tiny-note')];
  const movers=layers.map((el,i)=>{g.set(el,{transformPerspective:850,transformOrigin:'50% 50%'});return {x:quick(el,'x'),y:quick(el,'y'),rx:quick(el,'rotationX'),ry:quick(el,'rotationY'),depth:i===1?1:.55}});
  const cardMove=e=>{if(e.pointerType!=='mouse')return;const x=Math.max(-.5,Math.min(.5,(e.clientX-cardRect.left)/cardRect.width-.5)),y=Math.max(-.5,Math.min(.5,(e.clientY-cardRect.top)/cardRect.height-.5));movers.forEach(m=>{m.x(x*20*m.depth);m.y(y*14*m.depth);m.rx(-y*13*m.depth);m.ry(x*15*m.depth)})};
  const cardReset=()=>movers.forEach(m=>{m.x(0);m.y(0);m.rx(0);m.ry(0)});
  hero.addEventListener('pointerenter',measure);hero.addEventListener('pointermove',heroMove);hero.addEventListener('pointerleave',heroReset);composition.addEventListener('pointerenter',measure);composition.addEventListener('pointermove',cardMove);composition.addEventListener('pointerleave',cardReset);window.addEventListener('resize',measure);window.addEventListener('scroll',measure,{passive:true});measure();
  return()=>{hero.removeEventListener('pointerenter',measure);hero.removeEventListener('pointermove',heroMove);hero.removeEventListener('pointerleave',heroReset);composition.removeEventListener('pointerenter',measure);composition.removeEventListener('pointermove',cardMove);composition.removeEventListener('pointerleave',cardReset);window.removeEventListener('resize',measure);window.removeEventListener('scroll',measure)};
 });
 const refresh=()=>{if(!main.hidden)ST.refresh()};
 document.fonts.ready.then(refresh);
 window.addEventListener('load',refresh,{once:true});
 return {refresh,destroy(){mm.revert();}};
}
