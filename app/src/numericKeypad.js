/**
 * Custom numeric keypad for Gain.
 * Set values are buttons, not native number inputs, so iOS never opens its
 * keyboard or the extra previous/next/done accessory bar.
 */
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

export function installNumericKeypad(root,{onValue}){
  const backdrop=document.createElement('div');
  backdrop.className='gain-numpad-backdrop';
  backdrop.hidden=true;
  const panel=document.createElement('section');
  panel.className='gain-numpad';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  panel.setAttribute('aria-labelledby','gain-numpad-title');
  panel.tabIndex=-1;
  panel.hidden=true;
  panel.innerHTML=`<div class="gain-numpad-heading">
      <div><h2 id="gain-numpad-title"></h2><p class="gain-numpad-context"></p></div>
      <span class="gain-numpad-unit"></span>
    </div>
    <div class="gain-numpad-display" role="status" aria-live="polite" aria-atomic="true"></div>
    <div class="gain-numpad-shortcuts" aria-label="Quick adjustments"></div>
    <div class="gain-numpad-grid" aria-label="Numeric keys"></div>
    <button type="button" class="gain-numpad-done" data-close>Done</button>`;
  document.body.append(backdrop,panel);
  const title=panel.querySelector('#gain-numpad-title');
  const context=panel.querySelector('.gain-numpad-context');
  const unit=panel.querySelector('.gain-numpad-unit');
  const display=panel.querySelector('.gain-numpad-display');
  const shortcuts=panel.querySelector('.gain-numpad-shortcuts');
  const grid=panel.querySelector('.gain-numpad-grid');
  let active=null;

  function keyButton(key,label,aria,klass=''){
    const button=document.createElement('button');
    button.type='button';
    button.className=klass;
    button.dataset.key=key;
    button.textContent=label;
    button.setAttribute('aria-label',aria||label);
    return button;
  }
  function paint(){
    if(!active)return;
    display.textContent=active.text||'—';
  }
  function change(key){
    if(!active)return;
    const next=applyNumericKey(active,key,active.field);
    if(next.text===active.text&&next.fresh===active.fresh)return;
    active={...active,...next};
    paint();
    onValue(active.trigger,numericDraftValue(active.text,active.field));
  }
  function close({restoreFocus=true}={}){
    if(!active)return;
    const trigger=active.trigger;
    active=null;
    panel.hidden=true;
    backdrop.hidden=true;
    root.inert=false;
    if(restoreFocus&&trigger.isConnected){
      trigger.focus({preventScroll:true});
    }else if(document.activeElement===panel){
      panel.blur();
    }
  }
  function open(trigger,{field,value,description}){
    if(!VALID_FIELDS.has(field))return;
    if(active)close({restoreFocus:false});
    active={
      trigger,field,
      text:value===null||value===undefined?'':String(value),
      fresh:true
    };
    title.textContent=field==='weight'?'Weight':'Repetitions';
    context.textContent=description||'';
    unit.textContent=field==='weight'?'kg':'reps';
    const steps=field==='weight'?[-5,-2.5,2.5,5]:[-1,1];
    shortcuts.replaceChildren(...steps.map(step=>keyButton(
      'step:'+step,step>0?'+'+step:String(step).replace('-','−'),
      (step>0?'Increase ':'Decrease ')+(field==='weight'?'weight':'repetitions')+
      ' by '+Math.abs(step)+(field==='weight'?' kilograms':''),
      'gain-numpad-shortcut')));
    grid.replaceChildren(...[
      ...'123456789',
      field==='weight'?'decimal':'clear','0','backspace'
    ].map(key=>keyButton(key,
      key==='decimal'?'.':key==='clear'?'Clear':key==='backspace'?'⌫':key,
      key==='decimal'?'Decimal point':key==='clear'?'Clear value':
      key==='backspace'?'Delete last digit':key,
      'gain-numpad-key')));
    paint();
    backdrop.hidden=false;
    panel.hidden=false;
    root.inert=true;
    panel.focus({preventScroll:true});
    // Keep the selected set visible above the keypad where practical.
    requestAnimationFrame(()=>{
      if(!active||active.trigger!==trigger)return;
      const rect=trigger.getBoundingClientRect();
      const available=panel.getBoundingClientRect().top-18;
      if(rect.bottom>available)window.scrollBy(0,rect.bottom-available);
    });
  }
  panel.addEventListener('click',event=>{
    const button=event.target.closest('button');
    if(!button)return;
    if(button.hasAttribute('data-close'))close();
    else if(button.dataset.key)change(button.dataset.key);
  });
  backdrop.addEventListener('click',()=>close());
  document.addEventListener('keydown',event=>{
    if(!active)return;
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
    }else if(event.key==='Enter'&&event.target===panel){
      event.preventDefault();
      close();
      return;
    }else if(event.key==='Tab'){
      // Keep keyboard focus inside the modal while it is open.
      const buttons=Array.from(panel.querySelectorAll('button:not([disabled])'));
      const i=buttons.indexOf(document.activeElement);
      const next=event.shiftKey?(i<=0?buttons.length-1:i-1):(i<0||i===buttons.length-1?0:i+1);
      event.preventDefault();
      buttons[next]?.focus();
      return;
    }
    if(key!==null){
      event.preventDefault();
      change(key);
    }
  },true);
  return {open,close,isOpen:()=>Boolean(active)};
}
