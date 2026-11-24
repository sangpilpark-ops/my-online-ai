import { env, AutoProcessor, AutoModelForVision2Seq, AutoTokenizer, AutoModelForCausalLM, RawImage } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/transformers.min.js';

env.allowLocalModels=false;
env.useBrowserCache=true;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.proxy=false;
env.backends.onnx.wasm.wasmPaths='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6/dist/';
const visionId='HuggingFaceTB/SmolVLM-256M-Instruct';
const textId='onnx-community/Qwen2.5-0.5B-Instruct';
const revision={photo:'d039ab0d4b9311b617e8ffec1d06c8464364aeb3',text:'22942cb7d7ba4cc81bb4673549ca4d4614469b5e'};
const progress_callback=e=>{
 if(e.status==='progress'&&e.total){const pct=Math.min(100,Math.floor(e.loaded/e.total*100));if(pct%5===0)self.postMessage({phase:'download',pct,file:String(e.file||'').split('/').pop()});}
};
let session;
async function load(mode){
 if(session)return session;
 const options={revision:revision[mode],progress_callback,device:'wasm',dtype:mode==='photo'?'uint8':'q4'};
 session=await Promise.all(mode==='photo'?
   [AutoProcessor.from_pretrained(visionId,options),AutoModelForVision2Seq.from_pretrained(visionId,options)]:
   [AutoTokenizer.from_pretrained(textId,options),AutoModelForCausalLM.from_pretrained(textId,options)]);
 return session;
}
self.addEventListener('message',async(e)=>{
 try {
   const {mode,file,question}=e.data;
   const [prep,model]=await load(mode);
   self.postMessage({phase:'run'});
   let inputs;
   if(mode==='photo'){
     // The file stays inside this local worker. Only fixed public model assets use the network.
     let image=await RawImage.read(file);
     if(Math.max(image.width,image.height)>1024){const f=1024/Math.max(image.width,image.height);image=await image.resize(Math.round(image.width*f),Math.round(image.height*f));}
     const messages=[{role:'user',content:[{type:'image'},{type:'text',text:question}]}];
     inputs=await prep(prep.apply_chat_template(messages,{add_generation_prompt:true}),[image]);
   }else{
     const messages=[{role:'system',content:'쉬운 한국어로 짧게 답하세요. 모르는 사실을 꾸미지 마세요.'},{role:'user',content:question}];
     inputs=prep(prep.apply_chat_template(messages,{tokenize:false,add_generation_prompt:true}),{add_special_tokens:false});
   }
   const output=await model.generate({...inputs,max_new_tokens:mode==='photo'?100:180,do_sample:false});
   const tokens=output.tolist()[0].slice(inputs.input_ids.dims[1]);
   const tokenizer=mode==='photo'?prep.tokenizer:prep;
   const answer=tokenizer.decode(tokens,{skip_special_tokens:true}).trim();
   if(!answer)throw Error('모델이 답변을 생성하지 못했습니다.');
   self.postMessage({phase:'done',answer});
 }catch(err){self.postMessage({phase:'error',detail:String(err?.message||err).slice(0,300)});}
});
