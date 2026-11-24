'use strict';
const $=id=>document.getElementById(id);
let mode='text', worker=null, photo=null, preview=null, busy=false;
const storageKey='my-ai-v2-local';let saved={profile:{},docs:[]}, interview=-1,turns=[];
try{const data=JSON.parse(localStorage.getItem(storageKey)||'null');if(data&&typeof data.profile==='object'&&Array.isArray(data.docs))saved=data;}catch{}
function store(note=''){let ok=true;try{localStorage.setItem(storageKey,JSON.stringify(saved));}catch{ok=false;}showNotes(note+(ok?'':' 이 브라우저가 저장을 허용하지 않아 이 탭에서만 유지됩니다.'));return ok;}
function showNotes(prefix=''){$('notes').textContent=prefix+' 자료 '+saved.docs.length+'개 · 기억 '+Object.keys(saved.profile).length+'개';}
function addDoc(name,text){text=text.trim();if(!text||text.length>30000||saved.docs.length>=12){showNotes('비어 있거나 보관 한도(파일당 30,000자, 총 12개)를 넘었어요.');return;}saved.docs.push({name,text});store('자료를 추가했어요.');}
$('addDoc').onclick=()=>{const v=$('paste').value;const n=saved.docs.length;addDoc('붙여넣은 자료 '+(n+1),v);if(saved.docs.length>n)$('paste').value='';};
$('docs').onchange=async()=>{for(const f of [...$('docs').files].slice(0,12)){if(!/\.(txt|md|csv)$/i.test(f.name)||f.size>100000){showNotes('TXT·MD·CSV를 100 KB 이내로 골라 주세요.');continue;}try{addDoc(f.name,new TextDecoder('utf-8',{fatal:true}).decode(await f.arrayBuffer()));}catch{showNotes('UTF-8 형식의 자료를 선택해 주세요.');}}$('docs').value='';};
$('erase').onclick=()=>{if(!confirm('이 브라우저에서 추가한 자료와 기억을 지울까요?'))return;dropWorker();setBusy(false);reqSources=[];$('paste').value='';$('question').value='';$('answer').textContent='';$('sourceNote').textContent='';saved={profile:{},docs:[]};turns=[];interview=-1;store('지웠어요.');$('result').hidden=true;};
showNotes();let reqSources=[], reqQ='';
function done(answer,url){$('answer').textContent=answer;$('actionLink').hidden=!url;if(url)$('actionLink').href=url;else $('actionLink').removeAttribute('href');$('sourceNote').textContent=reqSources.length?'참고한 자료: '+[...new Set(reqSources.map(x=>x.name))].join(', '):'';$('result').hidden=false;setBusy(false);if(mode==='text'){turns.push({role:'user',content:reqQ},{role:'assistant',content:answer});turns=turns.slice(-6);}}
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
function modelError(message){dropWorker();setBusy(false);if(mode==='text'&&reqSources.length){done('모델 답변은 만들지 못했지만, 질문과 관련된 자료 원문을 찾았어요.\n\n'+reqSources.map(x=>x.name+': '+x.text.trim()).join('\n\n'));status('답변 대신 브라우저에서 찾은 원문을 보여 줍니다.');return;}status(message,true);}
function setBusy(on){busy=on;$('run').disabled=on;$('stop').hidden=!on;$('photo').disabled=on;}
function dropWorker(){worker?.terminate();worker=null;}
function switchMode(next){if(next===mode)return;dropWorker();setBusy(false);mode=next;
 $('photoMode').setAttribute('aria-pressed',mode==='photo');$('textMode').setAttribute('aria-pressed',mode==='text');
 $('photoBox').hidden=mode!=='photo';$('result').hidden=true;$('question').value='';
 $('question').placeholder=mode==='photo'?'예: 사진에 무엇이 보여?':'예: 제품 소개 글을 세 문장으로 써줘.';
 $('modeNote').textContent=mode==='photo'?'사진 모델은 영어 질문이 더 안정적입니다. 예: What objects are visible?':'작은 모델입니다. 사실이나 계산 결과는 확인해 주세요.';
 status('처음 실행할 때 해당 모델 파일을 내려받습니다.');
}
$('photoMode').onclick=()=>switchMode('photo');$('textMode').onclick=()=>switchMode('text');
$('photo').onchange=()=>{
 if(preview)URL.revokeObjectURL(preview);$('preview').hidden=true;$('preview').removeAttribute('src');preview=null;photo=null;$('result').hidden=true;
 const picked=$('photo').files?.[0];if(!picked)return;
 if(!['image/jpeg','image/png','image/webp'].includes(picked.type)||picked.size>15*1024**2){$('photo').value='';status('JPG, PNG, WebP 사진을 15MB 이하로 선택하세요.',true);return;}
 photo=picked;preview=URL.createObjectURL(photo);$('preview').src=preview;$('preview').hidden=false;status('사진을 선택했습니다. 답변 받기를 눌러 주세요.');
};
$('stop').onclick=()=>{dropWorker();setBusy(false);status('멈췄습니다. 다시 답변을 요청할 수 있어요.');};
$('run').onclick=()=>{
 if(busy)return;
 if(location.protocol==='file:'){status('HTML을 직접 열면 모델을 불러올 수 없습니다. GitHub Pages 또는 로컬 HTTP에서 여세요.',true);return;}
 if(mode==='photo'&&!photo){status('사진을 먼저 선택하세요.',true);return;}
 const question=$('question').value.trim() || (mode==='photo'?'Describe what is visible in this image. If unsure, do not guess.':'');
 if(!question){status('질문을 입력하세요.',true);return;}
 reqQ=question;reqSources=[];
 if(mode==='text'){const x=AI.decide(question,saved.profile,interview);if(x){if(x.interview!==undefined)interview=x.interview;const persisted=!x.write||(saved.profile[x.write[0]]=x.write[1],store());done(x.answer+(persisted?'':' (새로고침하면 사라집니다.)'),x.url);status(x.url?'검색 링크 준비 · 자동 탐색 아님':'응답 완료');return;}reqSources=AI.relevant(question,saved.docs);if(!reqSources.length&&/내\s*(?:가\s*넣은\s*)?자료|업로드한\s*자료/.test(question)){done('질문과 맞는 참고 자료를 찾지 못했어요. 위에서 파일이나 글을 추가해 주세요.');return;}}
 $('result').hidden=true;setBusy(true);status('모델을 확인하는 중입니다. 처음에는 시간이 걸릴 수 있어요.');
 try{
  if(!worker){
   worker=new Worker(new URL('./worker.mjs',location.href),{type:'module'});
   worker.onmessage=({data:d})=>{
    if(d.phase==='download')status(`모델 파일 ${d.file}: ${d.pct}%`);
    if(d.phase==='run')status('이 기기에서 답변을 만드는 중입니다.');
    if(d.phase==='done'){done(d.answer);status('답변을 만들었습니다.');}
    if(d.phase==='error')modelError(`모델 실행 실패: ${d.detail}`);
   };
   worker.onerror=()=>modelError('모델 파일을 불러오지 못했습니다. 최신 Chrome/Edge와 네트워크를 확인하세요.');
  }
  worker.postMessage({mode,file:mode==='photo'?photo:null,question,history:mode==='text'?turns:[],references:reqSources.map(x=>x.text),style:mode==='text'?(saved.profile.style||''):''});
 }catch(e){modelError(`브라우저가 모델을 시작하지 못했습니다: ${e.message}`);}
};
window.addEventListener('pagehide',()=>{dropWorker();setBusy(false);});
