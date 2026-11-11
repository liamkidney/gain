import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stepNumericValue,keyboardBottomOffset} from '../app/src/keyboardToolbar.js';

test('weight shortcuts add and subtract 2.5 or 5 kg',()=>{
  assert.equal(stepNumericValue('60','weight',2.5),62.5);
  assert.equal(stepNumericValue('60','weight',-2.5),57.5);
  assert.equal(stepNumericValue('60','weight',5),65);
  assert.equal(stepNumericValue('60','weight',-5),55);
  assert.equal(stepNumericValue('','weight',2.5),2.5);
  assert.equal(stepNumericValue('2','weight',-5),0);
  assert.equal(stepNumericValue('0.1','weight',2.5),2.6);
});
test('reps use whole-number increments and never become negative',()=>{
  assert.equal(stepNumericValue('8','reps',1),9);
  assert.equal(stepNumericValue('8','reps',-1),7);
  assert.equal(stepNumericValue('','reps',1),1);
  assert.equal(stepNumericValue('0','reps',-1),0);
});
test('keyboard toolbar tracks visible viewport edge without a negative offset',()=>{
  assert.equal(keyboardBottomOffset(800,500,0),300);
  assert.equal(keyboardBottomOffset(800,500,75),225);
  assert.equal(keyboardBottomOffset(500,500,0),0);
  assert.equal(keyboardBottomOffset(500,700,0),0);
});
test('page transitions isolate sticky headers and history dividers',()=>{
  const css=fs.readFileSync('app/style.css','utf8');
  assert.match(css,/\.page-motion>\.page-underlay,[\s\S]*?\.page-motion>\.page-target\s*\{[^}]*isolation:isolate/);
  assert.match(css,/\.page-motion>\.page-enter,[\s\S]*?\.page-motion>\.page-exit\s*\{[^}]*isolation:isolate/);
  assert.match(css,/\.swipe-back-underlay\s*\{[^}]*isolation:isolate/);
  assert.match(css,/\.swipe-back-front\s*\{[^}]*isolation:isolate/);
});
test('numeric shortcuts update the model without rerendering and preserve native keyboard',()=>{
  const app=fs.readFileSync('app/src/app.js','utf8');
  assert.match(app,/function persistNumericInput/);
  assert.match(app,/onStep:\(input,value\)=>persistNumericInput\(input,value\)/);
  assert.match(app,/inputmode="decimal"/);
  assert.match(app,/inputmode="numeric"/);
});
