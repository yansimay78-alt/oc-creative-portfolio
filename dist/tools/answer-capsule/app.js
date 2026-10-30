import { createMachine } from './scene.js?v=scene-8c';
import { ORIGINAL_ANSWERS, ANSWER_TAGS } from './answers-original.js?v=open-8b';
import { createAnswerDeck } from './draw-engine.js?v=open-8b';
import { questionThemes } from './question-themes.js?v=open-8b';

const $ = id => document.getElementById(id);
const answers = ORIGINAL_ANSWERS;
let storage = null;
try { storage = window.localStorage; } catch {}
const deck = createAnswerDeck(answers, storage, Math.random, ANSWER_TAGS);
let state = 'loading', question = '', world = null, soundOn = false, audio = null;
let theme = 'sunny';
try { theme = storage?.getItem('oracle-theme') === 'cyber' ? 'cyber' : 'sunny'; } catch {}

function tone(frequency, duration = .12, type = 'sine', volume = .035) {
  if (!soundOn) return;
  try {
    audio ||= new (window.AudioContext || window.webkitAudioContext)();
    audio.resume();
    const osc = audio.createOscillator(), gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audio.currentTime);
    gain.gain.setValueAtTime(volume, audio.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
    osc.connect(gain); gain.connect(audio.destination);
    osc.start(); osc.stop(audio.currentTime + duration);
  } catch {}
}
function setState(next, message) {
  state = next;
  document.body.dataset.state = next;
  $('status').textContent = message;
  const step = ['idle', 'coin', 'mix', 'answer'].indexOf(next === 'minting' ? 'question' : next === 'egg' || next === 'opening' ? 'answer' : next);
  document.querySelectorAll('[data-step]').forEach((e, i) => {
    e.classList.toggle('active', i === (next === 'minting' ? 0 : step));
    e.classList.toggle('complete', i < step);
  });
  document.querySelectorAll('[data-theme-choice]').forEach(button => {
    button.disabled = ['loading', 'minting', 'mix', 'opening'].includes(next);
  });
}
function applyTheme(next, save = true) {
  theme = next;
  document.body.dataset.theme = theme;
  world?.setTheme(theme, !save);
  const isDay = theme === 'sunny';
  const brandName = isDay ? '晴光扭蛋所' : '霓虹扭蛋所';
  const brandCaption = isDay ? 'DAYLIGHT ORACLE' : 'NEON ORACLE';
  $('brand-name').textContent = brandName;
  $('brand-caption').textContent = brandCaption;
  $('brand').setAttribute('aria-label', brandName);
  $('note-brand').textContent = brandCaption;
  document.title = brandName + ' · 答案扭蛋机';
  document.querySelectorAll('[data-theme-choice]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme)));
  document.querySelector('meta[name="theme-color"]').content = theme === 'sunny' ? '#f5dbd4' : '#080c1c';
  if (save) try { storage?.setItem('oracle-theme', theme); } catch {}
}
applyTheme(theme, false);
$('library-count').textContent = `原创签文 · ${deck.total} 条 · 整轮不重复`;
try {
  world = createMachine($('scene'), type => { if (type === 'insert') insert(); if (type === 'open') openEgg(); });
  world.setTheme(theme, true);
  $('loading').hidden = true;
  setState('idle', '把问题留给偶然，把选择留给自己。');
} catch (error) {
  console.error('3D scene initialization failed', error);
  $('loading').hidden = true; $('fallback').hidden = false; $('form').hidden = true;
  setState('error', '3D 场景未能启动，请刷新页面或使用支持 WebGL 的浏览器。');
}
for (const button of document.querySelectorAll('[data-theme-choice]')) button.addEventListener('click', () => applyTheme(button.dataset.themeChoice));
$('view-up').addEventListener('click', () => world?.adjustView(0, .045));
$('view-down').addEventListener('click', () => world?.adjustView(0, -.045));
$('view-reset').addEventListener('click', () => world?.resetView());
$('scene').addEventListener('keydown', e => {
  const moves = {ArrowUp:[0,.045], ArrowDown:[0,-.045], ArrowLeft:[-.08,0], ArrowRight:[.08,0]};
  if (moves[e.key]) { e.preventDefault(); world?.adjustView(...moves[e.key]); }
  if (e.key === 'Home') { e.preventDefault(); world?.resetView(); }
});
$('question').addEventListener('input', () => { $('mint').disabled = state !== 'idle' || !$('question').value.trim(); });
$('form').addEventListener('submit', async e => {
  e.preventDefault();
  if (state !== 'idle' || !$('question').value.trim()) return;
  question = $('question').value.trim();
  $('question').blur(); $('question').disabled = true; $('form').hidden = true;
  $('action').hidden = false; $('action').disabled = true; $('action').textContent = '心事铸币中…';
  $('mint-question').textContent = question; $('mint-echo').hidden = false;
  setState('minting', '把这句话揉成光，铸成一枚只属于你的游戏币。');
  tone(330, .35, 'sine');
  const chime = setInterval(() => tone(550 + Math.random() * 400, .18, 'sine', .018), 280);
  try { await world.mint(question); } finally { clearInterval(chime); $('mint-echo').hidden = true; }
  setState('coin', '游戏币已生成。点击硬币，或轻触下方投币。');
  $('action').disabled = false; $('action').textContent = '投入游戏币 ↗';
  tone(880, .25); setTimeout(() => tone(1320, .3), 120);
});
async function insert() {
  if (state !== 'coin') return;
  setState('mix', '让所有可能性翻滚一下，等待你的那一颗。');
  $('action').disabled = true; $('action').textContent = '正在寻找回音…';
  tone(170, .3, 'triangle');
  const tick = setInterval(() => tone(90 + Math.random() * 150, .05, 'triangle', .018), 180);
  try { await world.insert(); } finally { clearInterval(tick); }
  setState('egg', '你的答案已到达。点击出蛋口的胶囊，打开它。');
  $('action').disabled = false; $('action').textContent = '打开这颗扭蛋 ✦';
  tone(520, .15); setTimeout(() => tone(780, .25), 120);
}
async function openEgg() {
  if (state !== 'egg') return;
  setState('opening', '拆开一颗未知，收到此刻的答案。');
  $('action').disabled = true;
  await world.open();
  const result = deck.draw(questionThemes(question));
  $('asked').textContent = question; $('answer').textContent = result.text;
  $('number').textContent = `NO. ${String(result.index + 1).padStart(3, '0')} / ${result.total}`;
  $('overlay').hidden = false; $('action').hidden = true;
  setState('answer', `收到第 ${result.drawn} 枚灵感签，这一轮还有 ${result.total - result.drawn} 枚未读。`);
  $('again').focus(); tone(880, .4); setTimeout(() => tone(1320, .45), 160);
}
$('action').addEventListener('click', () => { if (state === 'coin') insert(); else if (state === 'egg') openEgg(); });
function reset() {
  if (state !== 'answer') return;
  $('overlay').hidden = true; world.reset();
  $('question').value = ''; $('question').disabled = false; $('form').hidden = false;
  $('mint').disabled = true; $('action').hidden = true;
  setState('idle', '下一个问题，也会有它的回音。');
  if (window.matchMedia('(pointer:fine)').matches) $('question').focus();
}
$('again').addEventListener('click', reset); $('close').addEventListener('click', reset);
$('sound').addEventListener('click', () => {
  soundOn = !soundOn; $('sound').setAttribute('aria-pressed', String(soundOn));
  $('sound').setAttribute('aria-label', soundOn ? '关闭音效' : '开启音效'); tone(520);
});
document.addEventListener('keydown', e => {
  if (state !== 'answer') return;
  if (e.key === 'Escape') reset();
  if (e.key === 'Tab') { e.preventDefault(); (document.activeElement === $('again') ? $('close') : $('again')).focus(); }
});
