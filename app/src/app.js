import {CATALOG,allExercises,findExercise,MUSCLES,EQUIPMENT} from './catalog.js';
import {LocalStore} from './storage.js';
import {newId,todayLocal,now,newSet,newEntry,createWorkout,createTemplate,repeatWorkout,startTemplate,lastCompletedSets,exerciseSeries,workoutSummary,touch,formatDate,formatNumber,sanitizeImport,finiteOrNull} from './model.js';
import {makeChart,since} from './charts.js';

const BUILD=window.GAIN_BUILD||{channel:'dev',revision:'local',base:'/gain/dev/'};
const root=document.querySelector('#app');
const store=new LocalStore(BUILD.channel);
const db={workouts:[],templates:[],customExercises:[]};
const ui={tab:'workouts',view:'home',recordId:null,recordType:'workouts',pickerSearch:'',pickerMuscle:'All',pickerEquipment:'All',infoExercise:null,pickerReturn:null,fromDetail:null,analyticsExercise:null,metric:'max',range:'quarter',point:null,toast:'',saved:true,infoReturn:'editor',showArchived:false,transition:'',homeScrollY:0};
let writeQueue=Promise.resolve(), toastTimer;
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const ico=(name,size=20)=>{const p={archive:'<rect x="4" y="4" width="16" height="5" rx="1"/><path d="M6 9v11h12V9M10 13h4"/>',back:'<path d="m15 18-6-6 6-6"/>',plus:'<path d="M12 5v14M5 12h14"/>',chevron:'<path d="m9 18 6-6-6-6"/>',down:'<path d="m6 9 6 6 6-6"/>',check:'<path d="m20 6-11 11-5-5"/>',repeat:'<path d="m17 2 4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4m14-3v4a3 3 0 0 1-3 3H3"/>',edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4z"/>',trash:'<path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 10v6M14 10v6"/>',chart:'<path d="M3 3v18h18M7 16l4-5 4 3 5-8"/>',history:'<path d="M3 12a9 9 0 1 0 3-7M3 3v6h6M12 7v5l3 2"/>',list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',template:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v3h6V3M9 11h6M9 15h6"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',settings:'<path d="M12 2v3m0 14v3M2 12h3m14 0h3M4.9 4.9l2.1 2.1m10 10 2.1 2.1m0-14.2L17 7m-10 10-2.1 2.1"/><circle cx="12" cy="12" r="4"/>',info:'<circle cx="12" cy="12" r="10"/><path d="M12 11v6M12 7h.01"/>',up:'<path d="m6 15 6-6 6 6"/>',download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',upload:'<path d="M12 21V9m-5 5 5-5 5 5M4 7V3h16v4"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>',dumbbell:'<path d="m6 6 12 12M2 6l4-4 4 4-4 4zM14 18l4-4 4 4-4 4z"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',spark:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',filter:'<path d="M4 7h16M7 12h10M10 17h4"/>'}[name]||'<circle cx="12" cy="12" r="8"/>';return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`};
const button=(label,action,opts={})=>`<button class="btn ${opts.class||''}" data-action="${action}" ${opts.attrs||''}>${opts.icon?ico(opts.icon,18):''}${label}</button>`;
const count=(w)=>workoutSummary(w);
const exercise=(id)=>findExercise(id,db.customExercises)||{id,name:'Unknown exercise',muscle:'Other',equipment:'Other',diagram:'core',instructions:''};
const imageFor=e=>{const known=new Set(['press','fly','squat','hinge','extension','lunge','curl','pull','row','ohp','raise','pushdown','calf','core','carry','thrust','hip-thrust']);return `./assets/exercises/${known.has(e.diagram)?e.diagram:'core'}.svg`;};
function byRecent(a,b){return b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt);}
function current(){return db[ui.recordType].find(r=>r.id===ui.recordId);}
function toast(message) {ui.toast=message;renderToast();clearTimeout(toastTimer);toastTimer=setTimeout(()=>{ui.toast='';renderToast();},3000);}
function renderToast(){let el=document.querySelector('#gain-toast');if(el){el.textContent=ui.toast;el.hidden=!ui.toast;}}
function savedIndicator(saving){ui.saved=!saving;const tag=document.querySelector('#save-indicator');if(tag)tag.textContent=saving?'Saving…':'Saved locally';}
function enqueue(storeName,record){const snapshot=structuredClone(touch(record));Object.assign(record,{updatedAt:snapshot.updatedAt});savedIndicator(true);writeQueue=writeQueue.catch(()=>{}).then(()=>store.put(storeName,snapshot)).then(()=>savedIndicator(false)).catch(err=>{console.error(err);toast('Save failed. Export your data and check available storage.');});return writeQueue;}
function deleteRecord(type,id){db[type]=db[type].filter(x=>x.id!==id);savedIndicator(true);writeQueue=writeQueue.catch(()=>{}).then(()=>store.remove(type,id)).then(()=>savedIndicator(false)).catch(err=>toast('Unable to delete: '+err.message));return writeQueue;}
function mutate(fn){const record=current();if(!record)return;fn(record);enqueue(ui.recordType,record);render();}
function goHome(tab='workouts'){ui.tab=tab;ui.view='home';ui.recordId=null;ui.point=null;ui.transition='';render(true);}
function openRecord(type,id,view='editor'){if(ui.view==='home')ui.homeScrollY=window.scrollY;ui.recordType=type;ui.recordId=id;ui.view=view;ui.transition='push';render(true);}
function newWorkout(){const w=createWorkout();db.workouts.push(w);enqueue('workouts',w);openRecord('workouts',w.id,'editor');}
function copyWorkout(id){const old=db.workouts.find(w=>w.id===id);if(!old)return;const w=repeatWorkout(old);db.workouts.push(w);enqueue('workouts',w);openRecord('workouts',w.id,'editor');toast('New workout created from history');}
function templateWorkout(id){const t=db.templates.find(x=>x.id===id);if(!t)return;const w=startTemplate(t,db.workouts);db.workouts.push(w);enqueue('workouts',w);openRecord('workouts',w.id,'editor');}
function newTemplate(){const t=createTemplate();db.templates.push(t);enqueue('templates',t);openRecord('templates',t.id,'editor');}
function showPicker(){ui.pickerReturn='editor';ui.view='picker';ui.pickerSearch='';ui.pickerMuscle='All';ui.pickerEquipment='All';render(true);}
function selectExercise(id){const record=current();if(!record)return;const prev=ui.recordType==='workouts'?lastCompletedSets(db.workouts,id,record.date,record.id):[];const sets=prev.length?prev.map(s=>newSet(s.weight,s.reps)):Array.from({length:3},()=>newSet());record.exercises.push(newEntry(id,sets));enqueue(ui.recordType,record);ui.view='editor';render(true);toast('Exercise added');}
function editInput(id,value,entryIdx,setIdx){mutate(record=>{if(id==='name')record.name=value.trim()||'Workout';if(id==='date'&&/^\d{4}-\d{2}-\d{2}$/.test(value))record.date=value;if(id==='notes'&&record.exercises[entryIdx])record.exercises[entryIdx].notes=value;if(['weight','reps'].includes(id)){const set=record.exercises[entryIdx]?.sets[setIdx];if(set)set[id]=finiteOrNull(value);}});}
function formatWeight(s){return `${formatNumber(s.weight)} kg × ${formatNumber(s.reps)}`;}
function titleBar(title,{back=false,settings=false,action=''}={}){return `<header class="topbar"><div class="topbar-title">${back?`<button class="icon-button back" data-action="back" aria-label="Back">${ico('back')}</button>`:''}<h1>${esc(title)}</h1></div><div class="topbar-actions">${action}${settings?`<button class="icon-button" data-action="settings" aria-label="Settings">${ico('settings')}</button>`:''}</div></header>`;}
function footer(){return `<nav class="bottom-nav" aria-label="Main navigation">${[['workouts','Workouts','list'],['templates','Templates','template'],['analytics','Analytics','chart']].map(([id,label,icon])=>`<button data-action="nav" data-id="${id}" class="nav-item ${ui.tab===id?'active':''}">${ico(icon,22)}<span>${label}</span></button>`).join('')}</nav>`;}
function layout(content,top){
  const previous=window.scrollY;
  const transition=ui.transition;ui.transition='';
  const oldMain=root.querySelector('.shell > main');
  const animate=oldMain&&(transition==='push'||transition==='pop')&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Preserve the preceding page behind the new page, as in a messaging app's thread navigation.
  const oldContent=animate?oldMain.innerHTML:'';
  const page=animate?`<div class="page-motion">
      <main class="${transition==='push'?'page-underlay':'page-target'}" ${transition==='push'?'inert aria-hidden="true"':''}>${transition==='push'?oldContent:content}</main>
      <main class="${transition==='push'?'page-enter':'page-exit'}" ${transition==='pop'?'inert aria-hidden="true"':''}>${transition==='push'?content:oldContent}</main>
    </div>`:`<main>${content}</main>`;
  root.innerHTML=`<div class="shell">${page}${footer()}<div id="gain-toast" class="toast" ${ui.toast?'':'hidden'}>${esc(ui.toast)}</div></div>`;
  if(animate){
    const wrapper=root.querySelector('.page-motion');
    const moving=wrapper.querySelector(transition==='push'?'.page-enter':'.page-exit');
    let cleaned=false;
    const finish=()=>{
      if(cleaned||!wrapper.isConnected)return;
      cleaned=true;
      clearTimeout(fallback);
      const keep=wrapper.querySelector(transition==='push'?'.page-enter':'.page-target');
      keep.className='';
      wrapper.replaceWith(keep);
    };
    moving.addEventListener('animationend',event=>{if(event.target===moving)finish();},{once:true});
    const fallback=setTimeout(finish,600);
  }
  requestAnimationFrame(()=>window.scrollTo(0,transition==='pop'?ui.homeScrollY:(top?0:previous)));
}
function homeWorkouts(){
  const list=db.workouts.filter(w=>Boolean(w.archivedAt)===ui.showArchived).sort(byRecent);
  const archiveCount=db.workouts.filter(w=>w.archivedAt).length;
  const header=ui.showArchived?'Archived':'History';
  return `${titleBar('Gain',{settings:true})}<section class="screen workouts-home">
    <div class="hero-row"><h2>Workouts</h2></div>
    ${button('New workout','new-workout',{class:'primary wide',icon:'plus'})}
    <div class="section-heading"><h3>${header}</h3><button class="history-toggle" data-action="toggle-archive-view">${ui.showArchived?'‹ History':`Archived${archiveCount?` (${archiveCount})`:''}`}</button></div>
    ${ui.showArchived?'<p class="archive-explanation">Archived workouts are kept but excluded from analytics and previous-performance comparisons.</p>':''}
    ${list.length?`<div class="inbox">${list.map(w=>{
      const parts=w.date.split('-');const date=new Date(`${w.date}T12:00:00`);const c=count(w);
      return `<div class="inbox-swipe" data-swipe-row="${esc(w.id)}">
        <div class="swipe-actions"><button class="swipe-repeat" data-action="repeat-item" data-id="${esc(w.id)}">${ico('repeat',19)}<span>Repeat</span></button><button class="swipe-archive" data-action="archive-item" data-id="${esc(w.id)}">${ico(w.archivedAt?'history':'archive',19)}<span>${w.archivedAt?'Restore':'Archive'}</span></button></div>
        <div class="inbox-slide"><button class="inbox-item" data-action="open-workout" data-id="${esc(w.id)}"><span class="date-circle"><strong>${Number(parts[2])}</strong><small>${date.toLocaleDateString('en-GB',{month:'short'})}</small></span><span class="inbox-main"><span class="inbox-line"><strong>${esc(w.name||'Workout')}</strong><time>${esc(date.toLocaleDateString('en-GB',{weekday:'short'}))}</time></span><span class="inbox-line secondary"><span>${c.exercises} exercises · ${c.sets} logged sets</span></span></span>${ico('chevron',17)}</button></div>
      </div>`;
    }).join('')}</div>`:`<div class="empty-state">${ico('dumbbell',36)}<h3>${ui.showArchived?'No archived workouts':'Your diary starts here'}</h3><p>${ui.showArchived?'Archive a workout from the history list to see it here.':'Start a workout or choose a saved template. Your training history appears here.'}</p></div>`}
  </section>`;
}
function homeTemplates(){return `${titleBar('Templates',{settings:true})}<section class="screen">${button('New template','new-template',{class:'primary wide',icon:'plus'})}<p class="subtle intro">Saved workout structures. Starting one uses your latest recorded weights and reps where available.</p>${db.templates.length?`<div class="cards">${[...db.templates].sort((a,b)=>a.name.localeCompare(b.name)).map(t=>`<button class="template-card" data-action="open-template" data-id="${esc(t.id)}"><div class="template-badge">${ico('template',22)}</div><div class="grow"><strong>${esc(t.name)}</strong><div class="muted small">${t.exercises.length} exercise${t.exercises.length===1?'':'s'}</div></div>${ico('chevron',18)}</button>`).join('')}</div>`:`<div class="empty-state">${ico('template',36)}<h3>No templates yet</h3><p>Create a repeatable workout with exercises and set counts. You can also repeat any past workout from History.</p></div>`}</section>`;}
function detailWorkout(){return editor();}
function detailTemplate(){return editor();}
function exerciseDetails(entry,done){const e=exercise(entry.exerciseId);return `<article class="exercise-summary"><div class="summary-head"><img src="${imageFor(e)}" alt="" loading="lazy"><div class="grow"><strong>${esc(e.name)}</strong><span class="muted small">${esc(e.muscle)} · ${esc(e.equipment)}</span></div><button class="icon-button" data-action="exercise-info" data-id="${esc(e.id)}" aria-label="Exercise instructions">${ico('info',19)}</button></div><div class="summary-sets">${entry.sets.filter(s=>!done||s.completed).map((s,i)=>`<span class="pill">${formatWeight(s)}</span>`).join('')||'<span class="muted small">No completed sets</span>'}</div></article>`;}
function editor(){
  const record=current();if(!record)return homeWorkouts();
  const template=ui.recordType==='templates';const archived=Boolean(record.archivedAt);
  return `${titleBar(template?'Template':'Workout',{back:true,action:template?`<button class="text-action topbar-repeat" data-action="start-template">Start ${ico('chevron',16)}</button>`:`<button class="text-action topbar-repeat" data-action="repeat">${ico('repeat',17)} Repeat</button>`})}
    <section class="screen editing workout-screen">
      <div class="editor-identity">
        <input id="record-name" class="name-input" data-edit="name" value="${esc(record.name)}" maxlength="80" placeholder="Workout name" aria-label="Workout name">
        ${template?'':`<input id="record-date" class="date-input" data-edit="date" type="date" value="${esc(record.date)}" aria-label="Workout date">`}
      </div>
      <div class="workout-meta"><span>${record.exercises.length} exercises</span><span id="save-indicator">${ui.saved?'Saved locally':'Saving…'}</span></div>
      ${record.exercises.map((entry,i)=>editorExercise(entry,i,template,record)).join('')}
      ${button('Add exercise','show-picker',{class:'outline wide add-exercise',icon:'plus'})}
      ${record.exercises.length===0?'<p class="subtle helper">Choose an exercise to begin.</p>':''}
      <div class="workout-actions">
        ${template?'':`<button class="quiet-link" data-action="${archived?'restore-current':'archive-current'}">${ico(archived?'history':'archive',16)} ${archived?'Restore to history':'Archive workout'}</button>`}
        <button class="quiet-link danger" data-action="delete-record">${ico('trash',16)} Delete ${template?'template':'workout'}</button>
      </div>
      ${archived?'<p class="archive-explanation">Archived: excluded from analytics until restored.</p>':''}
    </section>`;
}
function editorExercise(entry,i,template,record){
  const e=exercise(entry.exerciseId);
  const prev=template?[]:lastCompletedSets(db.workouts,e.id,record.date,record.id);
  return `<article class="editor-exercise">
    <div class="exercise-top">
      <div class="exercise-title grow"><strong>${esc(e.name)}</strong><span>${esc(e.muscle)} · ${esc(e.equipment)}</span></div>
      <button class="icon-button" data-action="exercise-info" data-id="${esc(e.id)}" aria-label="Exercise instructions">${ico('info',18)}</button>
      <button class="icon-button" data-action="exercise-chart" data-id="${esc(e.id)}" aria-label="Exercise graph">${ico('chart',18)}</button>
    </div>
    <div class="set-table ${template?'template-sets':''}">
      <div class="set-head"><span>Set</span>${template?'':'<span>Previous</span>'}<span>kg</span><span>Reps</span>${template?'':'<span>Log</span>'}</div>
      ${entry.sets.map((s,j)=>{
        const old=prev[j];
        return `<div class="set-row ${s.completed?'completed':''}">
          <div class="set-number"><span>${j+1}</span><button class="remove-set" data-action="remove-set" data-entry="${i}" data-set="${j}" aria-label="Remove set ${j+1}">×</button></div>
          ${template?'':`<div class="previous-cell">${old?`${formatNumber(old.weight)} × ${formatNumber(old.reps)}`:'–'}</div>`}
          <input aria-label="Set ${j+1} weight in kilograms" inputmode="decimal" type="number" min="0" step="any" data-edit="weight" data-entry="${i}" data-set="${j}" value="${s.weight===null?'':esc(s.weight)}" placeholder="–">
          <input aria-label="Set ${j+1} repetitions" inputmode="numeric" type="number" min="0" step="1" data-edit="reps" data-entry="${i}" data-set="${j}" value="${s.reps===null?'':esc(s.reps)}" placeholder="–">
          ${template?'':`<button data-action="toggle-set" data-entry="${i}" data-set="${j}" class="done-check ${s.completed?'checked':''}" aria-label="${s.completed?'Unlog':'Log'} set ${j+1}" aria-pressed="${Boolean(s.completed)}">${s.completed?ico('check',17):''}</button>`}
        </div>`;
      }).join('')}
    </div>
    <div class="exercise-bottom">
      <button data-action="add-set" data-entry="${i}" class="add-set">${ico('plus',16)} Set</button>
      <details class="exercise-options"><summary>Options</summary><div class="exercise-options-menu"><button data-action="move-exercise" data-entry="${i}" data-delta="-1" ${i===0?'disabled':''}>Move up</button><button data-action="move-exercise" data-entry="${i}" data-delta="1" ${i===record.exercises.length-1?'disabled':''}>Move down</button><button data-action="remove-exercise" data-entry="${i}" class="danger">Remove exercise</button></div></details>
    </div>
    <details class="notes"><summary>Notes${entry.notes?' • Saved':''}</summary><textarea rows="2" data-edit="notes" data-entry="${i}" placeholder="Optional form or equipment notes">${esc(entry.notes)}</textarea></details>
  </article>`;
}
function renderPickerList(){const q=ui.pickerSearch.trim().toLowerCase();const choices=allExercises(db.customExercises).filter(e=>(!q||`${e.name} ${e.muscle} ${e.equipment}`.toLowerCase().includes(q))&&(ui.pickerMuscle==='All'||e.muscle===ui.pickerMuscle)&&(ui.pickerEquipment==='All'||e.equipment===ui.pickerEquipment)).sort((a,b)=>a.name.localeCompare(b.name));return choices.length?choices.map(e=>`<div class="picker-item"><button class="picker-select" data-action="pick-exercise" data-id="${esc(e.id)}"><img src="${imageFor(e)}" alt="" loading="lazy"><span class="grow"><strong>${esc(e.name)}</strong><small>${esc(e.muscle)} · ${esc(e.equipment)}</small></span>${ico('plus',20)}</button><button class="icon-button" data-action="exercise-info" data-id="${esc(e.id)}" aria-label="View instructions for ${esc(e.name)}">${ico('info',18)}</button></div>`).join(''):'<div class="empty-state small-empty">No matching exercises.</div>';}
function picker(){return `${titleBar('Add exercise',{back:true})}<section class="screen picker"><div class="search-box">${ico('search',19)}<input id="exercise-search" autocomplete="off" type="search" placeholder="Search exercises" value="${esc(ui.pickerSearch)}" aria-label="Search exercises"></div><div class="filters"><label><span>Muscle</span><select id="filter-muscle"><option>All</option>${[...new Set([...MUSCLES,...db.customExercises.map(x=>x.muscle)])].sort().map(x=>`<option value="${esc(x)}" ${x===ui.pickerMuscle?'selected':''}>${esc(x)}</option>`).join('')}</select></label><label><span>Equipment</span><select id="filter-equipment"><option>All</option>${[...new Set([...EQUIPMENT,...db.customExercises.map(x=>x.equipment)])].sort().map(x=>`<option value="${esc(x)}" ${x===ui.pickerEquipment?'selected':''}>${esc(x)}</option>`).join('')}</select></label></div><div id="picker-results">${renderPickerList()}</div><button class="quiet-link custom-add" data-action="custom-exercise">${ico('plus',17)} Create custom exercise</button></section>`;}
function infoScreen(){const e=exercise(ui.infoExercise);return `${titleBar('Exercise guide',{back:true})}<section class="screen info-screen"><div class="guide-illustration"><img src="${imageFor(e)}" alt="Schematic movement illustration for ${esc(e.name)}"></div><h2>${esc(e.name)}</h2><div class="tags"><span>${esc(e.muscle)}</span><span>${esc(e.equipment)}</span></div><h3>How to perform</h3><p>${esc(e.instructions)}</p><p class="subtle small">Illustrations are schematic. Adjust setup and range of motion to your equipment and ability.</p>${ui.infoReturn==='picker'?button('Add to workout','use-from-info',{class:'primary wide',icon:'plus'}):button('Back to workout','back',{class:'outline wide',icon:'back'})}</section>`;}
function homeAnalytics(){const activeWorkouts=db.workouts.filter(w=>!w.archivedAt);const tracked=[...new Set(activeWorkouts.flatMap(w=>w.exercises.filter(e=>e.sets.some(s=>s.completed)).map(e=>e.exerciseId)))];const chosen=ui.analyticsExercise&&tracked.includes(ui.analyticsExercise)?ui.analyticsExercise:tracked[0];ui.analyticsExercise=chosen||null;const name=chosen?exercise(chosen).name:'';const all=chosen?exerciseSeries(activeWorkouts,chosen):[];const earliest=since(ui.range);const points=all.filter(p=>!earliest||p.date>=earliest);const metricLabel={max:'Max weight',oneRM:'Estimated 1RM',volume:'Volume'}[ui.metric];const currentPoint=points.find(p=>p.id===ui.point);const total=activeWorkouts.filter(w=>w.exercises.some(e=>e.sets.some(s=>s.completed))).length;const totalSets=activeWorkouts.reduce((sum,w)=>sum+w.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.completed).length,0),0);return `${titleBar('Analytics',{settings:true})}<section class="screen analytics"><div class="stat-row"><div><strong>${total}</strong><span>Workouts logged</span></div><div><strong>${totalSets}</strong><span>Sets completed</span></div></div>${tracked.length?`<label class="field-label" for="analytics-exercise">Exercise</label><select id="analytics-exercise" class="analytics-select">${tracked.sort((a,b)=>exercise(a).name.localeCompare(exercise(b).name)).map(id=>`<option value="${esc(id)}" ${chosen===id?'selected':''}>${esc(exercise(id).name)}</option>`).join('')}</select><div class="metric-tabs">${[['max','Max weight'],['oneRM','Est. 1RM'],['volume','Volume']].map(([key,label])=>`<button class="${ui.metric===key?'active':''}" data-action="metric" data-id="${key}">${label}</button>`).join('')}</div><div class="chart-card"><div class="chart-title"><div><h3>${esc(metricLabel)}</h3><span>${esc(name)} · ${ui.metric==='volume'?'kg total':'kg'}</span></div></div>${makeChart(points,ui.metric)}<div class="chart-time">${[['month','1M'],['quarter','3M'],['year','1Y'],['all','All']].map(([key,label])=>`<button data-action="range" data-id="${key}" class="${ui.range===key?'active':''}">${label}</button>`).join('')}</div>${currentPoint?`<div class="chart-point-info"><strong>${formatDate(currentPoint.date)}</strong><span>${formatNumber(currentPoint[ui.metric])} kg · ${esc(currentPoint.workout)}</span><button class="quiet-link" data-action="chart-open-workout" data-id="${esc(currentPoint.id)}">Open workout ${ico('chevron',15)}</button></div>`:'<p class="muted small chart-tip">Tap a point to see the recorded workout.</p>'}</div><div class="section-heading"><h3>Exercise history</h3><span class="muted">${all.length} sessions</span></div><div class="analytics-history">${[...all].reverse().map(p=>`<button class="analytics-history-row" data-action="chart-open-workout" data-id="${esc(p.id)}"><span>${formatDate(p.date)}</span><strong>${p.max===null?'–':`${formatNumber(p.max)} kg`}</strong>${ico('chevron',16)}</button>`).join('')}</div><p class="subtle small">Estimated 1RM uses Epley's formula for sets of 12 reps or fewer. Volume is weight × reps across completed sets. Neither should be interpreted as a training recommendation.</p>`:`<div class="empty-state">${ico('chart',36)}<h3>Progress starts with a set</h3><p>Complete sets in your first workout to see exercise charts and history here.</p></div>`}</section>`;}
function settings(){return `${titleBar('Settings',{back:true})}<section class="screen"><h2>Your data</h2><p class="subtle intro">Gain currently saves everything on this device. There is no account or cloud backup yet.</p>${button('Export JSON backup','export',{class:'outline wide',icon:'download'})}${button('Import JSON backup','import',{class:'outline wide',icon:'upload'})}<input id="backup-file" type="file" accept=".json,application/json" hidden><div class="warning-box"><strong>Keep a backup</strong><p>Clearing browser data or deleting an installed PWA may permanently erase your local workouts. Export periodically.</p></div><h3>App</h3><div class="settings-row"><span>Version</span><strong>${esc(BUILD.channel)} · ${esc(BUILD.revision)}</strong></div><div class="settings-row"><span>Storage</span><strong>IndexedDB (local)</strong></div><div class="settings-row"><span>Units</span><strong>kg</strong></div><p class="subtle small">Development and production use separate local databases. To move data between them, export and import a backup.</p></section>`;}
function render(top=false){let html;switch(ui.view){case 'detail':html=editor();break;case 'editor':html=editor();break;case 'picker':html=picker();break;case 'info':html=infoScreen();break;case 'settings':html=settings();break;default:html=ui.tab==='workouts'?homeWorkouts():ui.tab==='templates'?homeTemplates():homeAnalytics();}layout(html,top);}
function back(){const leavingWorkout=(ui.view==='editor'||ui.view==='detail');switch(ui.view){case 'picker':ui.view='editor';break;case 'info':ui.view=ui.infoReturn;break;case 'editor':ui.view='home';break;case 'detail':ui.view='home';break;case 'settings':ui.view='home';break;default:ui.view='home';}if(leavingWorkout)ui.transition='pop';render(true);}
function requireConfirm(message){return window.confirm(message);}
function move(array,from,to){if(to<0||to>=array.length)return;const [item]=array.splice(from,1);array.splice(to,0,item);}
async function exportData(){await writeQueue;const data={app:'gain',schemaVersion:1,exportedAt:now(),workouts:db.workouts,templates:db.templates,customExercises:db.customExercises};const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`gain-backup-${todayLocal()}.json`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
async function importData(file){try{if(!file||file.size>10*1024*1024)throw Error('File is too large or missing.');const data=sanitizeImport(JSON.parse(await file.text()));if(!requireConfirm(`Import ${data.workouts.length} workouts and ${data.templates.length} templates? Matching IDs will be updated only if the backup is newer.`))return;await writeQueue;const merged={};for(const kind of ['workouts','templates','customExercises']){const existing=new Map(db[kind].map(r=>[r.id,r]));for(const record of data[kind]){const old=existing.get(record.id);if(!old||String(record.updatedAt||'')>String(old.updatedAt||''))existing.set(record.id,record);}merged[kind]=[...existing.values()];}await store.bulkMerge(merged);for(const kind of Object.keys(merged))db[kind]=merged[kind];goHome();toast('Backup imported');}catch(err){toast(err.message||'Unable to import backup.');}}
async function customExercise(){const name=window.prompt('Exercise name');if(!name?.trim())return;const muscle=window.prompt('Primary muscle group (e.g. Back, Chest, Shoulders)','Other')?.trim()||'Other';const equipment=window.prompt('Equipment (e.g. Machine, Cable, Dumbbell)','Other')?.trim()||'Other';const e={id:newId(),name:name.trim().slice(0,80),muscle:muscle.slice(0,40),equipment:equipment.slice(0,40),diagram:'core',instructions:'Custom exercise — add technique notes to your workout.'};db.customExercises.push(e);enqueue('customExercises',e);selectExercise(e.id);}

function archiveWorkout(id){
  const w=db.workouts.find(x=>x.id===id);if(!w)return;
  w.archivedAt=w.archivedAt?null:now();enqueue('workouts',w);
  const archived=Boolean(w.archivedAt);
  if(ui.view==='editor'&&ui.recordId===id)goHome('workouts');else render();
  toast(archived?'Workout archived · excluded from analytics':'Workout restored');
}
function closeSwipeRows(){for(const row of root.querySelectorAll('.inbox-swipe.open'))row.classList.remove('open');}
let swipeStart=null,suppressSwipeClick=false;
root.addEventListener('pointerdown',e=>{
  const row=e.target.closest('.inbox-swipe');if(!row||e.target.closest('.swipe-actions'))return;
  swipeStart={id:e.pointerId,row,x:e.clientX,y:e.clientY,dx:0,moving:false};
});
root.addEventListener('pointermove',e=>{
  const s=swipeStart;if(!s||s.id!==e.pointerId)return;
  const dx=e.clientX-s.x,dy=e.clientY-s.y;
  if(!s.moving&&Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.3)s.moving=true;
  if(s.moving){s.dx=dx;s.row.classList.add('swiping');const initial=s.row.classList.contains('open')?-166:0;const offset=Math.min(0,Math.max(-166,initial+dx));s.row.querySelector('.inbox-slide')?.style.setProperty('transform',`translateX(${offset}px)`);if(e.cancelable)e.preventDefault();}
});
function completeSwipe(e){const s=swipeStart;if(!s||s.id!==e.pointerId)return;swipeStart=null;
  if(!s.moving)return;
  const shouldOpen=s.dx<-45||(s.row.classList.contains('open')&&s.dx<40);
  closeSwipeRows();s.row.querySelector('.inbox-slide')?.style.removeProperty('transform');s.row.classList.remove('swiping');
  s.row.classList.toggle('open',shouldOpen);
  suppressSwipeClick=true;setTimeout(()=>{suppressSwipeClick=false;},360);
}
root.addEventListener('pointerup',completeSwipe);
root.addEventListener('pointercancel',e=>{const s=swipeStart;if(!s)return;swipeStart=null;s.row.querySelector('.inbox-slide')?.style.removeProperty('transform');s.row.classList.remove('swiping');});
async function handleAction(target){const action=target.dataset.action,id=target.dataset.id,entryIndex=Number(target.dataset.entry),setIndex=Number(target.dataset.set);switch(action){
case 'nav':goHome(id);break;
case 'new-workout':newWorkout();break;
case 'new-template':newTemplate();break;
case 'open-workout':closeSwipeRows();openRecord('workouts',id);break;
case 'open-template':openRecord('templates',id,'editor');break;
case 'back':back();break;
case 'settings':ui.view='settings';render(true);break;
case 'edit':ui.view='editor';render(true);break;
case 'repeat':copyWorkout(ui.recordId);break;
case 'repeat-item':copyWorkout(id);break;
case 'archive-item':archiveWorkout(id);break;
case 'archive-current':archiveWorkout(ui.recordId);break;
case 'restore-current':archiveWorkout(ui.recordId);break;
case 'toggle-archive-view':ui.showArchived=!ui.showArchived;render();break;
case 'start-template':templateWorkout(ui.recordId);break;
case 'show-picker':showPicker();break;
case 'pick-exercise':selectExercise(id);break;
case 'custom-exercise':await customExercise();break;
case 'exercise-info':ui.infoExercise=id;ui.infoReturn=ui.view;ui.view='info';render(true);break;
case 'use-from-info':selectExercise(ui.infoExercise);break;
case 'exercise-chart':ui.analyticsExercise=id;ui.tab='analytics';ui.view='home';ui.point=null;render(true);break;
case 'toggle-set':{const s=current()?.exercises[entryIndex]?.sets[setIndex];if(s&&!s.completed&&(s.weight===null&&s.reps===null)){toast('Enter the weight or reps first.');break;}mutate(r=>{const set=r.exercises[entryIndex]?.sets[setIndex];if(set)set.completed=!set.completed;});break;}
case 'add-set':mutate(r=>{const sets=r.exercises[entryIndex]?.sets;if(sets){const last=sets.at(-1);sets.push(newSet(last?.weight??null,last?.reps??null));}});break;
case 'remove-set':mutate(r=>{r.exercises[entryIndex]?.sets.splice(setIndex,1);});break;
case 'move-set':mutate(r=>{const sets=r.exercises[entryIndex]?.sets;if(sets)move(sets,setIndex,setIndex+Number(target.dataset.delta));});break;
case 'remove-exercise':if(requireConfirm(`Remove ${exercise(current().exercises[entryIndex].exerciseId).name} from this ${ui.recordType==='templates'?'template':'workout'}?`))mutate(r=>r.exercises.splice(entryIndex,1));break;
case 'move-exercise':mutate(r=>move(r.exercises,entryIndex,entryIndex+Number(target.dataset.delta)));break;
case 'delete-record':{const type=ui.recordType;const rec=current();if(rec&&requireConfirm(`Permanently delete "${rec.name}"?`)){await deleteRecord(type,rec.id);goHome(type==='templates'?'templates':'workouts');toast('Deleted');}break;}
case 'metric':ui.metric=id;ui.point=null;render();break;
case 'range':ui.range=id;ui.point=null;render();break;
case 'chart-open-workout':openRecord('workouts',id);break;
case 'export':await exportData();break;
case 'import':document.querySelector('#backup-file')?.click();break;
}}
root.addEventListener('click',e=>{if(suppressSwipeClick&&e.target.closest('.inbox-slide')){e.preventDefault();e.stopPropagation();suppressSwipeClick=false;return;}const point=e.target.closest('.chart-point');if(point){ui.point=point.dataset.id;render();return;}const target=e.target.closest('[data-action]');if(!target||target.disabled)return;handleAction(target).catch(err=>{console.error(err);toast('Something went wrong: '+err.message);});});
root.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target.matches('.chart-point')){e.preventDefault();ui.point=e.target.dataset.id;render();}});
root.addEventListener('change',e=>{const el=e.target;if(el.dataset.edit){editInput(el.dataset.edit,el.value,Number(el.dataset.entry),Number(el.dataset.set));return;}if(el.id==='filter-muscle'){ui.pickerMuscle=el.value;document.querySelector('#picker-results').innerHTML=renderPickerList();}if(el.id==='filter-equipment'){ui.pickerEquipment=el.value;document.querySelector('#picker-results').innerHTML=renderPickerList();}if(el.id==='analytics-exercise'){ui.analyticsExercise=el.value;ui.point=null;render();}if(el.id==='backup-file'&&el.files?.[0])importData(el.files[0]);});
root.addEventListener('input',e=>{if(e.target.id==='exercise-search'){ui.pickerSearch=e.target.value;document.querySelector('#picker-results').innerHTML=renderPickerList();}});
async function init(){try{for(const key of ['workouts','templates','customExercises'])db[key]=await store.all(key);root.innerHTML='';render(true);if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){try{const reg=await navigator.serviceWorker.register(`./sw.js?v=${BUILD.revision}`,{scope:'./',updateViaCache:'none'});let hadController=!!navigator.serviceWorker.controller;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(hadController)location.reload();hadController=true;});document.addEventListener('visibilitychange',()=>{if(!document.hidden)reg.update().catch(()=>{});});window.addEventListener('pageshow',()=>reg.update().catch(()=>{}));}catch(err){console.warn('Service worker unavailable',err);}}}catch(err){root.innerHTML=`<div class="fatal"><h1>Gain could not open local storage</h1><p>${esc(err.message)}</p><p>Check that private browsing is disabled and browser storage is available.</p></div>`;}}
init();
