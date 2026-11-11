import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyNumericKey,numericDraftValue,stepNumericValue,keypadScrollDelta} from '../app/src/numericKeypad.js';

const press=(field,initial,keys)=>{
  let state={text:initial,fresh:true};
  for(const key of keys)state=applyNumericKey(state,key,field);
  return state;
};

test('weight buttons add and subtract 2.5 or 5 kilograms',()=>{
  assert.equal(stepNumericValue('60','weight',2.5),62.5);
  assert.equal(stepNumericValue('60','weight',-2.5),57.5);
  assert.equal(stepNumericValue('60','weight',5),65);
  assert.equal(stepNumericValue('60','weight',-5),55);
  assert.equal(stepNumericValue('2','weight',-5),0);
  assert.equal(stepNumericValue('', 'weight',2.5),2.5);
  assert.equal(stepNumericValue('0.1','weight',2.5),2.6);
});
test('reps buttons use whole-number increments',()=>{
  assert.equal(stepNumericValue('8','reps',1),9);
  assert.equal(stepNumericValue('8','reps',-1),7);
  assert.equal(stepNumericValue('0','reps',-1),0);
});
test('digit entry replaces the selected value, then appends',()=>{
  assert.deepEqual(press('weight','60',['7','2','decimal','5']),{text:'72.5',fresh:false});
  assert.deepEqual(press('reps','8',['1','2']),{text:'12',fresh:false});
  assert.equal(press('weight','60',['step:2.5']).text,'62.5');
  assert.equal(press('weight','60',['step:2.5','4']).text,'4');
});
test('decimal handling, deletion, clearing, and blank values',()=>{
  assert.equal(press('weight','',['decimal','5']).text,'0.5');
  assert.equal(press('weight','7',['decimal','decimal','5']).text,'7.5');
  assert.equal(press('reps','8',['decimal']).text,'8');
  assert.equal(press('reps','8',['backspace']).text,'');
  assert.equal(press('weight','50',['clear']).text,'');
  assert.equal(numericDraftValue('','weight'),null);
  assert.equal(numericDraftValue('0.','weight'),0);
  assert.equal(numericDraftValue('8','reps'),8);
});
test('rejects invalid numeric commands and overly long values',()=>{
  assert.deepEqual(applyNumericKey({text:'10',fresh:false},'step:99','weight'),{text:'10',fresh:false});
  assert.equal(press('weight','',['1','2','3','4','5','6','7','8']).text,'1234567');
  assert.equal(press('weight','',['decimal','1','2','3']).text,'0.12');
  assert.throws(()=>numericDraftValue('5','invalid'),TypeError);
});
test('workout logging uses buttons and never focuses a native numeric input',()=>{
  const app=fs.readFileSync('app/src/app.js','utf8');
  const css=fs.readFileSync('app/style.css','utf8');
  const sw=fs.readFileSync('app/sw.js','utf8');
  assert.match(app,/installNumericKeypad/);
  assert.match(app,/data-action="edit-set-value"/);
  assert.doesNotMatch(app,/inputmode="(?:decimal|numeric)"/);
  assert.doesNotMatch(app,/installNumericToolbar/);
  assert.match(css,/\.gain-numpad\s*\{/);
  assert.doesNotMatch(css,/\.numeric-toolbar\s*\{/);
  assert.match(sw,/\.\/src\/numericKeypad\.js/);
});

test('the selected field stays above the keypad without unnecessary page movement',()=>{
  assert.equal(keypadScrollDelta(700,360),356);
  assert.equal(keypadScrollDelta(260,360),0);
  assert.equal(keypadScrollDelta(345,360),1);
  assert.equal(keypadScrollDelta(360,360),16);
});

test('keypad contains buttons only and writes directly to its selected field',()=>{
  const keypad=fs.readFileSync('app/src/numericKeypad.js','utf8');
  const app=fs.readFileSync('app/src/app.js','utf8');
  const css=fs.readFileSync('app/style.css','utf8');
  assert.doesNotMatch(keypad,/gain-numpad-display|gain-numpad-heading|gain-numpad-context|backdrop/);
  assert.match(keypad,/onValue\(active\.trigger,active\.text,numericDraftValue/);
  assert.match(keypad,/requestAnimationFrame\(keepFieldVisible\)/);
  assert.match(keypad,/shell\?\.classList\.add\('gain-keypad-open'\)/);
  assert.match(app,/button\.textContent=text===''\?'–':text/);
  assert.match(css,/\.set-row \.set-value-button\.is-editing/);
  assert.match(css,/\.shell\.gain-keypad-open main/);
});

test('Done tick is on the right of the adjustment keys, not beneath the keypad',()=>{
  const js=fs.readFileSync('app/src/numericKeypad.js','utf8');
  const css=fs.readFileSync('app/style.css','utf8');
  const icons=fs.readFileSync('app/src/lucide.js','utf8');
  assert.match(js,/lucideIcon\('check',18\)/);
  assert.doesNotMatch(js,/done\.textContent='✓'/);
  assert.match(icons,/check: '<path d="M20 6 9 17l-5-5"\/>',/);
  assert.match(js,/done\.setAttribute\('aria-label','Done'\)/);
  assert.match(js,/shortcuts\.append\(done\)/);
  assert.doesNotMatch(js,/<button type="button" class="gain-numpad-done" data-close>Done<\/button>/);
  assert.match(css,/\.gain-numpad-shortcuts\{\s*display:flex/);
  assert.match(css,/\.gain-numpad-done\{\s*flex:0 0 44px/);
  assert.match(css,/\.gain-numpad-done\{[^}]*border:0;background:transparent/);
  assert.match(css,/\.gain-numpad-done-face\{[^}]*width:38px;height:38px/);
  assert.doesNotMatch(css,/\.gain-numpad-done\{[^}]*margin-top/);
});
