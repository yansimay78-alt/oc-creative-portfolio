export function initMusic(){
 const audio=document.querySelector('#background-music'),toggle=document.querySelector('#sound-toggle'),panel=document.querySelector('#sound-panel'),play=document.querySelector('#music-play'),volume=document.querySelector('#music-volume'),status=document.querySelector('#music-status');
 let wanted=false,request=0;
 audio.volume=.28;
 const videoPlaying=()=>[...document.querySelectorAll('video')].some(v=>!v.paused&&!v.ended);
 function sync(){const playing=!audio.paused&&!audio.ended;play.textContent=playing?'Ⅱ 暂停':'▷ 播放';play.setAttribute('aria-label',playing?'暂停背景音乐':'播放背景音乐');play.setAttribute('aria-pressed',String(playing));toggle.classList.toggle('is-playing',playing&&audio.volume>0);document.querySelector('#sound-label').textContent=playing?(audio.volume===0?'静音':'正在播放'):'音乐';status.textContent=videoPlaying()&&wanted?'观看视频时，音乐暂时休息。':playing?'让故事，慢慢继续。':'点播放，或点亮首页的旋转木马。';}
 async function start(){const id=++request;if(!wanted||videoPlaying()){sync();return}try{if(audio.error)audio.load();await audio.play();if(id!==request||!wanted)audio.pause();sync()}catch(error){if(id!==request||error.name==='AbortError')return;sync();status.textContent=error.name==='NotAllowedError'?'点击播放，开启背景音乐。':'音乐暂时无法播放，请点击播放重试。';}}
 function setPlaying(on){wanted=on;if(on)start();else{request++;audio.pause();sync()}}
 play.addEventListener('click',()=>setPlaying(audio.paused?!wanted||!videoPlaying():false));
 volume.addEventListener('input',()=>{audio.volume=Number(volume.value)/100;document.querySelector('#music-volume-value').textContent=volume.value+'%';sync()});
 toggle.addEventListener('click',()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden))});
 document.querySelector('.sound-panel-close').addEventListener('click',()=>{panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()});
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){panel.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus()}});
 ['play','pause','volumechange'].forEach(event=>audio.addEventListener(event,sync));
 audio.addEventListener('error',()=>{sync();status.textContent='音乐暂时无法加载，请点击播放重试。'});
 document.addEventListener('play',e=>{if(e.target.tagName==='VIDEO'){request++;audio.pause();sync()}},true);
 for(const event of ['pause','ended'])document.addEventListener(event,e=>{if(e.target.tagName==='VIDEO'&&wanted&&!videoPlaying())start()},true);
 sync();return {setPlaying};
}
