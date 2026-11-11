import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {stepNumericValue,keyboardToolbarPosition} from '../app/src/keyboardToolbar.js';

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
test('keyboard toolbar anchors to the visual viewport in document coordinates',()=>{
  assert.deepEqual(keyboardToolbarPosition(
    {pageTop:0,pageLeft:0,height:450,width:390},55),{top:395,centerX:195});
  // Keyboard opens, Safari scrolls the page and pans the visible viewport.
  assert.deepEqual(keyboardToolbarPosition(
    {pageTop:310,pageLeft:0,height:390,width:390},55),{top:645,centerX:195});
  // A smaller visible viewport moves the bar upward, not behind the keyboard.
  assert.deepEqual(keyboardToolbarPosition(
    {pageTop:0,pageLeft:0,height:320,width:390},55),{top:265,centerX:195});
  // Subtraction cannot push the toolbar to negative document coordinates.
  assert.deepEqual(keyboardToolbarPosition(
    {pageTop:0,pageLeft:0,height:40,width:390},55),{top:0,centerX:195});
});

test('toolbar is absolutely positioned and reads the page-top viewport position',()=>{
  const js=fs.readFileSync('app/src/keyboardToolbar.js','utf8');
  const css=fs.readFileSync('app/style.css','utf8');
  assert.match(js,/pageTop:Number\.isFinite\(vv\.pageTop\)/);
  assert.match(js,/toolbar\.style\.top=point\.top/);
  assert.match(js,/window\.addEventListener\('scroll',position/);
  assert.match(js,/settleTimers=\[80,200,400\]/);
  assert.match(css,/\.numeric-toolbar\s*\{\s*position:absolute/);
  assert.match(css,/\.numeric-toolbar\[hidden\]\{display:none\}/);
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
