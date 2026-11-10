export const newId = () => crypto.randomUUID();
export const todayLocal = (d=new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const now = () => new Date().toISOString();
export const newSet = (weight=null,reps=null,completed=false) => ({id:newId(),weight:finiteOrNull(weight),reps:finiteOrNull(reps),completed,kind:'working'});
export function finiteOrNull(x) { if (x===''||x===null||x===undefined) return null; const n=Number(x); return Number.isFinite(n)&&n>=0?n:null; }
export function newEntry(exerciseId,sets=[newSet()]) { return {id:newId(),exerciseId,notes:'',sets:sets.map(s=>({...s,id:newId()}))}; }
export function createWorkout({name='Workout',date=todayLocal(),source=null,exercises=[]}={}) {const t=now();return {id:newId(),name,date,status:'in_progress',source,exercises:structuredClone(exercises),createdAt:t,updatedAt:t};}
export function createTemplate(name='Template', exercises=[]) {const t=now();return {id:newId(),name,exercises:structuredClone(exercises),createdAt:t,updatedAt:t};}
export function duplicateEntries(entries) {return entries.map(e=>({...structuredClone(e),id:newId(),sets:e.sets.map(s=>({...s,id:newId(),completed:false}))}));}
export function repeatWorkout(previous,date=todayLocal()) {return createWorkout({name:previous.name,date,source:{type:'workout',id:previous.id},exercises:duplicateEntries(previous.exercises)});}
export function startTemplate(template, history=[],date=todayLocal()) {
  const entries=duplicateEntries(template.exercises);
  for (const entry of entries) {
    const last=lastCompletedSets(history,entry.exerciseId,date);
    if(last.length) entry.sets=entry.sets.map((set,i)=>({...set,weight:last[Math.min(i,last.length-1)].weight,reps:last[Math.min(i,last.length-1)].reps}));
  }
  return createWorkout({name:template.name,date,source:{type:'template',id:template.id},exercises:entries});
}
export function lastCompletedSets(history,exerciseId,beforeDate=null,ignoreWorkoutId=null) {
  const list=[...history].filter(w=>w.id!==ignoreWorkoutId&&(!beforeDate||w.date<beforeDate || w.date===beforeDate)).sort((a,b)=>b.date.localeCompare(a.date)||b.createdAt.localeCompare(a.createdAt));
  for(const w of list) {const entries=w.exercises.filter(x=>x.exerciseId===exerciseId); const sets=entries.flatMap(e=>e.sets).filter(s=>s.completed); if(sets.length) return sets.map(s=>({weight:s.weight,reps:s.reps}));}
  return [];
}
export function completedSets(workout,exerciseId) {return workout.exercises.filter(e=>e.exerciseId===exerciseId).flatMap(e=>e.sets.filter(s=>s.completed&&s.kind!=='warmup'));}
export function exerciseSeries(workouts,exerciseId) {
  return workouts.flatMap(w=>{const sets=completedSets(w,exerciseId);if(!sets.length)return [];const valid=sets.filter(s=>Number.isFinite(s.weight)&&s.weight>0&&Number.isFinite(s.reps)&&s.reps>0);return [{id:w.id,date:w.date,workout:w.name,sets:sets.length,max:valid.length?Math.max(...valid.map(s=>s.weight)):null,oneRM:valid.filter(s=>s.reps<=12).length?Math.max(...valid.filter(s=>s.reps<=12).map(s=>s.weight*(1+s.reps/30))):null,volume:valid.reduce((n,s)=>n+s.weight*s.reps,0)}]}) .sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
export function workoutSummary(w) {const completed=w.exercises.reduce((n,e)=>n+e.sets.filter(s=>s.completed).length,0);return {exercises:w.exercises.length,sets:completed,planned:w.exercises.reduce((n,e)=>n+e.sets.length,0)};}
export function touch(record) {return {...record,updatedAt:now()};}
export function sanitizeImport(payload) {if(!payload||payload.app!=='gain'||payload.schemaVersion!==1||!Array.isArray(payload.workouts)||!Array.isArray(payload.templates)||!Array.isArray(payload.customExercises))throw Error('Not a compatible Gain backup.');
  const clean=(a)=>a.filter(v=>v&&typeof v==='object'&&typeof v.id==='string'&&v.id.length<128).map(v=>structuredClone(v));
  return {workouts:clean(payload.workouts),templates:clean(payload.templates),customExercises:clean(payload.customExercises)};
}
export function formatDate(s) {return new Date(`${s}T12:00:00`).toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'});}
export function formatNumber(v) {return v===null||v===undefined||v===''?'–':Number(v).toLocaleString('en-GB',{maximumFractionDigits:1});}
