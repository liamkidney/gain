import test from 'node:test';
import assert from 'node:assert/strict';
import {createWorkout,createTemplate,newSet,newEntry,repeatWorkout,startTemplate,lastCompletedSets,exerciseSeries,workoutSummary,finiteOrNull,sanitizeImport,formatDate} from '../app/src/model.js';

function session(date, weight, reps, exerciseId='lat-pulldown') {
  const e=newEntry(exerciseId,[newSet(weight,reps,true),newSet(weight,reps-1,true)]);
  const w=createWorkout({name:'Pull',date,exercises:[e]});return w;
}

test('workout saves without a completion lifecycle',()=>{
  const w=createWorkout();assert.equal('status' in w,false);assert.equal(w.archivedAt,null);assert.equal(w.exercises.length,0);assert.match(w.id,/^[0-9a-f-]{36}$/);
});
test('repeat copies the actual historical structure and resets every checkbox',()=>{
  const old=session('2026-11-04',55,8);old.exercises.push(newEntry('dumbbell-bench',[newSet(22,9,true)]));
  const copy=repeatWorkout(old,'2026-11-10');assert.equal(copy.name,'Pull');assert.equal(copy.source.id,old.id);assert.equal(copy.exercises.length,2);assert.equal(copy.exercises[0].sets[0].weight,55);assert.equal(copy.exercises[0].sets[0].reps,8);assert.ok(copy.exercises.every(e=>e.sets.every(s=>!s.completed)));
  assert.notEqual(copy.id,old.id);assert.notEqual(copy.exercises[0].id,old.exercises[0].id);assert.notEqual(copy.exercises[0].sets[0].id,old.exercises[0].sets[0].id);
});
test('repeated workout modifications do not change the historical source',()=>{
  const old=session('2026-11-04',55,8),copy=repeatWorkout(old);copy.exercises[0].sets[0].weight=70;copy.exercises.splice(0,1);assert.equal(old.exercises[0].sets[0].weight,55);assert.equal(old.exercises.length,1);
});
test('templates use the latest completed performance but retain their set count',()=>{
  const previous=session('2026-10-25',50,9);const recent=session('2026-11-03',57.5,8);
  const t=createTemplate('Upper A',[newEntry('lat-pulldown',[newSet(null,null),newSet(null,null),newSet(null,null)])]);
  const newW=startTemplate(t,[previous,recent],'2026-11-10');assert.equal(newW.exercises.length,1);assert.equal(newW.exercises[0].sets.length,3);assert.deepEqual(newW.exercises[0].sets.map(s=>s.reps),[8,7,7]);assert.deepEqual(newW.exercises[0].sets.map(s=>s.weight),[57.5,57.5,57.5]);assert.ok(newW.exercises[0].sets.every(s=>!s.completed));assert.equal(t.exercises[0].sets[0].weight,null);
});
test('historical workout lookups exclude future workouts and current workout',()=>{
  const before=session('2026-10-01',40,10),current=session('2026-11-01',50,10),future=session('2027-01-01',60,10);
  assert.equal(lastCompletedSets([future,current,before],'lat-pulldown','2026-11-01',current.id)[0].weight,40);
});
test('analytics use only completed sets and recompute on historical correction',()=>{
  const w=session('2026-11-01',55,8);w.exercises[0].sets.push(newSet(100,2,false));
  let a=exerciseSeries([w],'lat-pulldown');assert.equal(a.length,1);assert.equal(a[0].max,55);assert.equal(a[0].volume,55*8+55*7);assert.ok(Math.abs(a[0].oneRM-55*(1+8/30))<.01);
  w.exercises[0].sets[0].weight=60;a=exerciseSeries([w],'lat-pulldown');assert.equal(a[0].max,60);assert.equal(a[0].volume,60*8+55*7);
});
test('warmup sets are excluded from working-set progress',()=>{
  const w=session('2026-11-01',40,8);w.exercises[0].sets[0].kind='warmup';assert.equal(exerciseSeries([w],'lat-pulldown')[0].volume,40*7);
});
test('empty data, bodyweight and numeric validation remain safe',()=>{
  const w=session('2026-11-01',null,10,'pull-up');const d=exerciseSeries([w],'pull-up');assert.equal(d.length,1);assert.equal(d[0].max,null);assert.equal(d[0].volume,0);assert.equal(finiteOrNull(''),null);assert.equal(finiteOrNull('-2'),null);assert.equal(finiteOrNull('2.5'),2.5);assert.equal(workoutSummary(w).sets,2);
});
test('backup requires compatible schema',()=>{
  assert.throws(()=>sanitizeImport({app:'gain',schemaVersion:2,workouts:[],templates:[],customExercises:[]}));
  const backup={app:'gain',schemaVersion:1,workouts:[session('2026-11-01',40,8)],templates:[],customExercises:[]};assert.equal(sanitizeImport(backup).workouts.length,1);
});
test('dates are interpreted as local calendar dates',()=>assert.match(formatDate('2026-11-04'),/4 Nov 2026/));

test('archived workouts are excluded from analytics and previous performance, without deleting data',()=>{
  const a=session('2026-10-01',40,10);const b=session('2026-11-02',70,8);b.archivedAt='2026-11-08T12:00:00.000Z';
  const summary=exerciseSeries([a,b],'lat-pulldown');assert.equal(summary.length,1);assert.equal(summary[0].max,40);
  assert.equal(lastCompletedSets([a,b],'lat-pulldown','2026-11-10')[0].weight,40);
  assert.equal(b.exercises.length,1);b.archivedAt=null;
  assert.equal(exerciseSeries([a,b],'lat-pulldown').length,2);
  assert.equal(lastCompletedSets([a,b],'lat-pulldown','2026-11-10')[0].weight,70);
});
test('old workout exports without archivedAt remain included',()=>{
  const w=session('2026-11-01',40,10);delete w.archivedAt;
  assert.equal(exerciseSeries([w],'lat-pulldown').length,1);
});
