/**
 * Custom numeric keypad for Gain.
 * Set values are buttons, not native number inputs, so iOS never opens its
 * keyboard or the extra previous/next/done accessory bar.
 */
import {lucideIcon} from './lucide.js';
import {calculatePlateLoading,renderPlateLoading} from './plateLoading.js';

const VALID_FIELDS=new Set(['weight','reps']);

export function numericDraftValue(text,field){
  if(!VALID_FIELDS.has(field))throw new TypeError('Invalid numeric field');
  if(text===''||text===null||text===undefined)return null;
  const n=Number(text);
  if(!Number.isFinite(n)||n<0)return null;
  return field==='reps'?Math.trunc(n):n;
}

export function stepNumericValue(raw,field,delta){
  if(!VALID_FIELDS.has(field))throw new TypeError('Invalid numeric field');
  if(!Number.isFinite(delta))throw new TypeError('Invalid numeric step');
  const base=numericDraftValue(raw,field)??0;
  return field==='reps'
    ?Math.max(0,Math.round(base)+Math.trunc(delta))
    :Math.max(0,Math.round((base+delta)*100)/100);
}

/** Pure reducer: keep an edit buffer separate from its saved numeric value. */
export function applyNumericKey(state,key,field){
  if(!VALID_FIELDS.has(field))throw new TypeError('Invalid numeric field');
  const text=String(state.text??'');
  const fresh=Boolean(state.fresh);
  if(key.startsWith('step:')){
    const delta=Number(key.slice(5));
    const allowed=field==='weight'?[-5,-2.5,2.5,5]:[-1,1];
    if(!allowed.includes(delta))return {text,fresh};
    return {text:String(stepNumericValue(text,field,delta)),fresh:true};
  }
  if(key==='clear')return {text:'',fresh:true};
  if(key==='backspace')return {text:text.slice(0,-1),fresh:false};
  if(key==='decimal'){
    if(field!=='weight'||text.includes('.'))return {text,fresh};
    return {text:(text||'0')+'.',fresh:false};
  }
  if(!/^[0-9]$/.test(key))return {text,fresh};
  const next=fresh||text===''||text==='0'?key:text+key;
  // Seven whole-number digits and up to two decimal places are ample for kg.
  const parts=next.split('.');
  if(parts[0].length>7||(parts[1]&&parts[1].length>2))return {text,fresh};
  return {text:next,fresh:false};
}


/** Number of pixels needed to raise the selected cell above the keypad. */
export function keypadScrollDelta(fieldBottom,keypadTop,margin=16){
  return Math.max(0,Math.ceil(fieldBottom-keypadTop+margin));
}
/** A deliberate pull or a sufficiently quick downward flick dismisses the keypad. */
export function shouldDismissKeypadSwipe(distancePx,durationMs){
  if(!Number.isFinite(distancePx)||distancePx<=0)return false;
  return distancePx>=92||(distancePx>=42&&durationMs>0&&distancePx/durationMs>=0.45);
}

export function installNumericKeypad(root,{onValue}){
  const panel=document.createElement('section');
  panel.id='gain-numpad';
  panel.className='gain-numpad';
  panel.setAttribute('role','group');
  panel.setAttribute('aria-label','Numeric keypad');
  panel.hidden=true;
  panel.innerHTML=`<div class="gain-numpad-keyboard">
      <div class="gain-numpad-shortcuts" aria-label="Quick adjustments"></div>
      <div class="gain-numpad-grid" aria-label="Numeric keys"></div>
    </div>
    <section class="gain-bar-loading" aria-label="Bar loading guide" hidden>
      <header class="gain-bar-header">
        <button type="button" class="gain-bar-back" data-loading-back aria-label="Back to keypad">${lucideIcon('arrow-left',20)}</button>
        <strong>Bar loading</strong>
        <button type="button" class="gain-bar-done" data-close aria-label="Done">${lucideIcon('check',19)}</button>
      </header>
      <div class="gain-bar-loading-body"></div>
    </section>`;
  document.body.append(panel);
  const keyboard=panel.querySelector('.gain-numpad-keyboard');
  const loading=panel.querySelector('.gain-bar-loading');
  const loadingBody=panel.querySelector('.gain-bar-loading-body');
  const shortcuts=panel.querySelector('.gain-numpad-shortcuts');
  const grid=panel.querySelector('.gain-numpad-grid');
  let active=null;
  let pointerGesture=null;
  let suppressTapUntil=0;
  let exitTimer=null;
  let animationToken=0;
  const prefersReducedMotion=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function finishExit(token){
    if(token!==animationToken||active||panel.classList.contains('is-open'))return;
    clearTimeout(exitTimer);
    exitTimer=null;
    panel.hidden=true;
    panel.classList.remove('is-dragging');
    panel.style.removeProperty('--gain-drag-y');
  }
  function keyButton(key,label,aria,klass=''){
    const button=document.createElement('button');
    button.type='button';
    button.className=klass;
    button.dataset.key=key;
    button.textContent=label;
    button.setAttribute('aria-label',aria||label);
    return button;
  }
  function keepFieldVisible(){
    if(!active||!active.trigger.isConnected||panel.hidden)return;
    const field=active.trigger.getBoundingClientRect();
    // Ignore the sheet's temporary vertical translation during slide/drag.
    const anchoredTop=window.innerHeight-panel.offsetHeight;
    const delta=keypadScrollDelta(field.bottom,anchoredTop);
    if(delta>0)window.scrollBy(0,delta);
  }
  function syncHeight(){
    const shell=root.querySelector('.shell');
    shell?.style.setProperty('--gain-keypad-height',Math.ceil(panel.getBoundingClientRect().height)+'px');
    requestAnimationFrame(keepFieldVisible);
  }
  function showLoading(){
    if(!active||active.field!=='weight')return;
    const result=calculatePlateLoading(numericDraftValue(active.text,'weight'));
    loadingBody.innerHTML=renderPlateLoading(result);
    keyboard.hidden=true;
    loading.hidden=false;
    syncHeight();
    loading.querySelector('[data-loading-back]')?.focus({preventScroll:true});
  }
  function showKeypad(){
    if(!active)return;
    loading.hidden=true;
    keyboard.hidden=false;
    syncHeight();
    active.trigger.focus({preventScroll:true});
  }
  function change(key){
    if(!active||!loading.hidden)return;
    const next=applyNumericKey(active,key,active.field);
    if(next.text===active.text&&next.fresh===active.fresh)return;
    active={...active,...next};
    // The workout cell itself is the display; preserve partial decimals while typing.
    onValue(active.trigger,active.text,numericDraftValue(active.text,active.field));
  }
  function close({restoreFocus=true,preservePanel=false}={}){
    if(!active)return;
    const {trigger,field,text}=active;
    active=null;
    if(trigger.isConnected){
      // Canonicalize drafts such as "60." or "003" when editing ends.
      const value=numericDraftValue(text,field);
      onValue(trigger,value===null?'':String(value),value);
      trigger.classList.remove('is-editing');
      trigger.setAttribute('aria-expanded','false');
    }
    if(!preservePanel){
      loading.hidden=true;
      keyboard.hidden=false;
      const shell=root.querySelector('.shell');
      shell?.classList.remove('gain-keypad-open');
      shell?.style.removeProperty('--gain-keypad-height');
      panel.classList.remove('is-dragging','is-open');
      panel.style.removeProperty('--gain-drag-y');
      const token=++animationToken;
      if(prefersReducedMotion())finishExit(token);
      else exitTimer=setTimeout(()=>finishExit(token),420);
    }
    if(restoreFocus&&trigger.isConnected)trigger.focus({preventScroll:true});
  }
  function open(trigger,{field,value}){
    if(!VALID_FIELDS.has(field))return;
    const alreadyOpen=panel.classList.contains('is-open')&&!panel.hidden;
    if(active)close({restoreFocus:false,preservePanel:true});
    clearTimeout(exitTimer);
    exitTimer=null;
    ++animationToken;
    panel.classList.remove('is-dragging');
    panel.style.removeProperty('--gain-drag-y');
    active={
      trigger,field,
      text:value===null||value===undefined?'':String(value),
      fresh:true
    };
    const steps=field==='weight'?[-5,-2.5,2.5,5]:[-1,1];
    shortcuts.replaceChildren(...steps.map(step=>keyButton(
      'step:'+step,step>0?'+'+step:String(step).replace('-','−'),
      (step>0?'Increase ':'Decrease ')+(field==='weight'?'weight':'repetitions')+
      ' by '+Math.abs(step)+(field==='weight'?' kilograms':''),
      'gain-numpad-shortcut')));
    if(field==='weight'){
      const plates=document.createElement('button');
      plates.type='button';
      plates.className='gain-numpad-plates';
      plates.setAttribute('data-plates','');
      plates.setAttribute('aria-label','Show Olympic bar loading');
      plates.setAttribute('title','Bar loading');
      plates.innerHTML=lucideIcon('dumbbell',19);
      shortcuts.append(plates);
    }
    // The Done control lives at the right edge of the adjustment row.
    const done=document.createElement('button');
    done.type='button';
    done.className='gain-numpad-done';
    done.setAttribute('data-close','');
    done.setAttribute('aria-label','Done');
    done.innerHTML=`<span class="gain-numpad-done-face">${lucideIcon('check',18)}</span>`;
    shortcuts.append(done);
    grid.replaceChildren(...[
      ...'123456789',
      field==='weight'?'decimal':'clear','0','backspace'
    ].map(key=>keyButton(key,
      key==='decimal'?'.':key==='clear'?'Clear':key==='backspace'?'⌫':key,
      key==='decimal'?'Decimal point':key==='clear'?'Clear value':
      key==='backspace'?'Delete last digit':key,
      'gain-numpad-key')));
    panel.setAttribute('aria-label',field==='weight'?'Weight keypad':'Repetitions keypad');
    panel.hidden=false;
    const shell=root.querySelector('.shell');
    shell?.classList.add('gain-keypad-open');
    loading.hidden=true;
    keyboard.hidden=false;
    syncHeight();
    trigger.classList.add('is-editing');
    trigger.setAttribute('aria-expanded','true');
    trigger.focus({preventScroll:true});
    const token=animationToken;
    if(alreadyOpen){
      panel.classList.add('is-open');
      requestAnimationFrame(keepFieldVisible);
    }else{
      // Force the hidden/off-screen state to paint before the sheet slides up.
      panel.classList.remove('is-open');
      requestAnimationFrame(()=>{
        if(token!==animationToken||!active)return;
        panel.classList.add('is-open');
        requestAnimationFrame(keepFieldVisible);
      });
    }
  }
  panel.addEventListener('transitionend',event=>{
    if(event.target===panel&&event.propertyName==='transform'&&!panel.classList.contains('is-open')){
      finishExit(animationToken);
    }
  });
  panel.addEventListener('pointerdown',event=>{
    if(!active||!panel.classList.contains('is-open'))return;
    if(event.pointerType==='mouse'&&event.button!==0)return;
    pointerGesture={id:event.pointerId,x:event.clientX,y:event.clientY,
      start:performance.now(),dragging:false,distance:0};
  });
  panel.addEventListener('pointermove',event=>{
    const gesture=pointerGesture;
    if(!gesture||gesture.id!==event.pointerId)return;
    const dy=event.clientY-gesture.y;
    const dx=event.clientX-gesture.x;
    if(!gesture.dragging){
      if(dy>10&&dy>Math.abs(dx)*1.25){
        gesture.dragging=true;
        panel.classList.add('is-dragging');
      }else if(dy< -12||Math.abs(dx)>18){
        pointerGesture=null;
        return;
      }else return;
    }
    gesture.distance=Math.max(0,dy);
    panel.style.setProperty('--gain-drag-y',Math.round(gesture.distance)+'px');
    if(event.cancelable)event.preventDefault();
  });
  function releaseSwipe(event,cancelled=false){
    const gesture=pointerGesture;
    if(!gesture||gesture.id!==event.pointerId)return;
    pointerGesture=null;
    if(!gesture.dragging)return;
    suppressTapUntil=Date.now()+420;
    panel.classList.remove('is-dragging');
    panel.style.removeProperty('--gain-drag-y');
    if(!cancelled&&shouldDismissKeypadSwipe(gesture.distance,performance.now()-gesture.start)){
      close({restoreFocus:false});
    }
  }
  panel.addEventListener('pointerup',event=>releaseSwipe(event));
  panel.addEventListener('pointercancel',event=>releaseSwipe(event,true));
  panel.addEventListener('click',event=>{
    if(Date.now()<suppressTapUntil){
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }
  },true);
  panel.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-close'))close();
    else if(button.hasAttribute('data-plates'))showLoading();
    else if(button.hasAttribute('data-loading-back'))showKeypad();
    else if(button.dataset.key)change(button.dataset.key);
  });
  // Unlike a modal, the rest of the form stays visible and can be scrolled.
  // Tapping another cell switches the keypad directly to that cell.
  document.addEventListener('pointerdown',event=>{
    if(!active||panel.contains(event.target))return;
    if(event.target.closest?.('[data-action="edit-set-value"]'))return;
    close({restoreFocus:false});
  },true);
  window.addEventListener('resize',()=>requestAnimationFrame(keepFieldVisible));
  window.visualViewport?.addEventListener('resize',()=>requestAnimationFrame(keepFieldVisible));
  document.addEventListener('keydown',event=>{
    if(!active)return;
    if(event.target.closest?.('input,textarea,select,[contenteditable="true"]')){
      close({restoreFocus:false});
      return;
    }
    if(!loading.hidden){
      if(event.key==='Escape'){
        event.preventDefault();
        showKeypad();
      }
      return;
    }
    // External keyboards work without any editable HTML input.
    let key=null;
    if(/^[0-9]$/.test(event.key))key=event.key;
    else if(event.key==='.'||event.key===',')key='decimal';
    else if(event.key==='Backspace')key='backspace';
    else if(event.key==='Delete')key='clear';
    else if(event.key==='Escape'){
      event.preventDefault();
      close();
      return;
    }else if(event.key==='Enter'&&event.target===active.trigger){
      event.preventDefault();
      close();
      return;
    }else if(event.key==='Tab'){
      // Allow normal focus navigation instead of trapping focus.
      close({restoreFocus:false});
      return;
    }
    if(key!==null){
      event.preventDefault();
      change(key);
    }
  },true);
  return {open,close,isOpen:()=>Boolean(active)};
}
