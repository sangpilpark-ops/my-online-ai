'use strict';
const $=id=>document.getElementById(id);
let mode='photo', worker=null, photo=null, preview=null, busy=false;
function status(text,error=false){$('status').textContent=text;$('status').classList.toggle('error',error);}
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
 $('result').hidden=true;setBusy(true);status('모델을 확인하는 중입니다. 처음에는 시간이 걸릴 수 있어요.');
 try{
  if(!worker){
   worker=new Worker(new URL('./worker.mjs',location.href),{type:'module'});
   worker.onmessage=({data:d})=>{
    if(d.phase==='download')status(`모델 파일 ${d.file}: ${d.pct}%`);
    if(d.phase==='run')status('이 기기에서 답변을 만드는 중입니다.');
    if(d.phase==='done'){$('answer').textContent=d.answer;$('result').hidden=false;setBusy(false);status('답변을 만들었습니다.');}
    if(d.phase==='error'){dropWorker();setBusy(false);status(`모델 실행 실패: ${d.detail}`,true);}
   };
   worker.onerror=()=>{dropWorker();setBusy(false);status('모델 파일을 불러오지 못했습니다. 최신 Chrome/Edge와 네트워크를 확인하세요.',true);};
  }
  worker.postMessage({mode,file:mode==='photo'?photo:null,question});
 }catch(e){dropWorker();setBusy(false);status(`브라우저가 모델을 시작하지 못했습니다: ${e.message}`,true);}
};
window.addEventListener('pagehide',()=>{dropWorker();setBusy(false);});
