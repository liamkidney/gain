/**
 * iOS Safari does not allow extra keys inside the native keyboard.
 * This accessory toolbar follows the VisualViewport so it sits above that keyboard.
 */
export function stepNumericValue(raw,field,delta){
  if(field!=='weight'&&field!=='reps')throw new TypeError('Unknown numeric field');
  if(!Number.isFinite(delta))throw new TypeError('Invalid step');
  const input=Number(raw);
  const base=raw===''||!Number.isFinite(input)||input<0?0:input;
  if(field==='reps')return Math.max(0,Math.round(base)+Math.trunc(delta));
  return Math.max(0,Math.round((base+delta)*100)/100);
}
export function keyboardBottomOffset(layoutHeight,visualHeight,visualTop=0){
  return Math.max(0,Math.round(layoutHeight-visualHeight-visualTop));
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
  };
  const position=()=>{
    if(toolbar.hidden)return;
    const vv=window.visualViewport;
    toolbar.style.bottom=(vv
      ?keyboardBottomOffset(window.innerHeight,vv.height,vv.offsetTop)
      :0)+'px';
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
    requestAnimationFrame(position);
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
  return {sync:()=>{
    if(activeInput&&!activeInput.isConnected)hide();
    else position();
  }};
}
