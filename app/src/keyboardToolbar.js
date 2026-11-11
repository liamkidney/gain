/**
 * iOS Safari does not allow extra keys inside the native keyboard.
 * This accessory toolbar follows document-space VisualViewport coordinates
 * rather than a fixed bottom offset, avoiding the iOS keyboard overlay.
 */
export function stepNumericValue(raw,field,delta){
  if(field!=='weight'&&field!=='reps')throw new TypeError('Unknown numeric field');
  if(!Number.isFinite(delta))throw new TypeError('Invalid step');
  const input=Number(raw);
  const base=raw===''||!Number.isFinite(input)||input<0?0:input;
  if(field==='reps')return Math.max(0,Math.round(base)+Math.trunc(delta));
  return Math.max(0,Math.round((base+delta)*100)/100);
}
// Absolute document coordinates avoid iOS WebKit's unreliable fixed-position
// containing block while the virtual keyboard shifts the visual viewport.
export function keyboardToolbarPosition(viewport,toolbarHeight){
  const top=Number.isFinite(viewport.pageTop)?viewport.pageTop:0;
  const height=Number.isFinite(viewport.height)?viewport.height:0;
  const left=Number.isFinite(viewport.pageLeft)?viewport.pageLeft:0;
  const width=Number.isFinite(viewport.width)?viewport.width:0;
  return {
    top:Math.max(0,Math.round(top+height-Math.max(0,toolbarHeight))),
    centerX:Math.round(left+width/2)
  };
}
export function installNumericToolbar(root,{onStep}){
  const toolbar=document.createElement('div');
  toolbar.className='numeric-toolbar';
  toolbar.setAttribute('role','toolbar');
  toolbar.hidden=true;
  document.body.append(toolbar);
  let activeInput=null;

  const hide=()=>{
    activeInput=null;
    toolbar.hidden=true;
    toolbar.replaceChildren();
    for(const id of settleTimers)clearTimeout(id);
    settleTimers=[];
  };
  const position=()=>{
    if(toolbar.hidden)return;
    const vv=window.visualViewport;
    const view=vv&&Number.isFinite(vv.height)&&vv.height>0?{
      pageTop:Number.isFinite(vv.pageTop)?vv.pageTop:window.scrollY+(vv.offsetTop||0),
      pageLeft:Number.isFinite(vv.pageLeft)?vv.pageLeft:window.scrollX+(vv.offsetLeft||0),
      height:vv.height,
      width:vv.width
    }:{
      pageTop:window.scrollY,
      pageLeft:window.scrollX,
      height:window.innerHeight,
      width:window.innerWidth
    };
    const point=keyboardToolbarPosition(view,toolbar.offsetHeight);
    toolbar.style.top=point.top+'px';
    toolbar.style.left=point.centerX+'px';
  };
  // iOS standalone PWAs can report an early/incorrect viewport size during
  // the keyboard opening animation. Sample it again once things settle.
  let settleTimers=[];
  const settle=()=>{
    for(const id of settleTimers)clearTimeout(id);
    settleTimers=[80,200,400].map(delay=>setTimeout(position,delay));
  };
  function show(input){
    activeInput=input;
    const weight=input.dataset.edit==='weight';
    const steps=weight?[-5,-2.5,2.5,5]:[-1,1];
    toolbar.setAttribute('aria-label',weight?'Weight shortcuts':'Repetition shortcuts');
    const label=document.createElement('span');
    label.className='numeric-toolbar-label';
    label.textContent=weight?'kg':'Reps';
    toolbar.replaceChildren(label);
    for(const step of steps){
      const button=document.createElement('button');
      button.type='button';
      button.className='numeric-toolbar-step';
      button.dataset.step=String(step);
      button.textContent=step>0?'+'+step:String(step).replace('-','−');
      button.setAttribute('aria-label',
        (step>0?'Increase ':'Decrease ')+(weight?'weight':'repetitions')+
        ' by '+Math.abs(step)+(weight?' kilograms':''));
      toolbar.append(button);
    }
    const done=document.createElement('button');
    done.type='button';
    done.className='numeric-toolbar-done';
    done.dataset.done='';
    done.textContent='Done';
    done.setAttribute('aria-label','Close number keyboard');
    toolbar.append(done);
    toolbar.hidden=false;
    position();
    requestAnimationFrame(()=>requestAnimationFrame(position));
    settle();
  }
  root.addEventListener('focusin',event=>{
    if(event.target.matches('input[data-edit="weight"],input[data-edit="reps"]'))show(event.target);
    else hide();
  });
  root.addEventListener('focusout',event=>{
    if(event.target!==activeInput)return;
    const departing=activeInput;
    // Focus may move directly to the next set input on the same tap.
    setTimeout(()=>{if(activeInput===departing&&document.activeElement!==departing)hide();},0);
  });
  // Avoid moving focus away from the input, which would dismiss iOS's keyboard.
  toolbar.addEventListener('pointerdown',event=>{
    if(event.target.closest('button'))event.preventDefault();
  });
  toolbar.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button||!activeInput?.isConnected)return;
    const input=activeInput;
    if(button.dataset.done!==undefined){
      input.blur();
      hide();
      return;
    }
    const step=Number(button.dataset.step);
    const next=stepNumericValue(input.value,input.dataset.edit,step);
    input.value=String(next);
    onStep(input,next);
    if(document.activeElement!==input)input.focus({preventScroll:true});
    position();
  });
  window.visualViewport?.addEventListener('resize',position);
  window.visualViewport?.addEventListener('scroll',position);
  window.addEventListener('resize',position);
  window.addEventListener('scroll',position,{passive:true});
  window.addEventListener('orientationchange',settle);
  return {sync:()=>{
    if(activeInput&&!activeInput.isConnected)hide();
    else position();
  }};
}
