import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {calculatePlateLoading,renderPlateDiagram,renderPlateLoading} from '../app/src/plateLoading.js';

const plates=weight=>calculatePlateLoading(weight).plates?.map(({kg,count})=>[kg,count]);

test('20 kg bar is counted once and the plates apply to each side',()=>{
  const seventy=calculatePlateLoading(70);
  assert.equal(seventy.status,'ok');
  assert.equal(seventy.barKg,20);
  assert.equal(seventy.perSideKg,25);
  assert.deepEqual(plates(70),[[25,1]]);
  assert.deepEqual(plates(60),[[20,1]]);
  assert.deepEqual(plates(100),[[25,1],[15,1]]);
  assert.deepEqual(plates(82.5),[[25,1],[5,1],[1.25,1]]);
  assert.deepEqual(plates(22.5),[[1.25,1]]);
});
test('empty 20 kg bar needs no plates',()=>{
  const result=calculatePlateLoading(20);
  assert.equal(result.status,'ok');
  assert.deepEqual(result.plates,[]);
  assert.match(renderPlateLoading(result),/No plates needed/);
});
test('unsupported total weight and weights below bar give explicit explanation',()=>{
  assert.equal(calculatePlateLoading(null).status,'empty');
  assert.equal(calculatePlateLoading('').status,'empty');
  assert.equal(calculatePlateLoading(-10).status,'invalid');
  assert.equal(calculatePlateLoading(NaN).status,'invalid');
  assert.equal(calculatePlateLoading(17.5).status,'below-bar');
  assert.equal(calculatePlateLoading(21).status,'unavailable');
  assert.equal(calculatePlateLoading(21.25).status,'unavailable');
  assert.match(renderPlateLoading(calculatePlateLoading(21)),/cannot be loaded symmetrically/);
  assert.match(renderPlateLoading(calculatePlateLoading(17.5)),/lighter than the 20 kg bar/);
});
test('plate diagram is one sleeve with mirrored load instruction',()=>{
  const result=calculatePlateLoading(70);
  const diagram=renderPlateDiagram(result);
  assert.match(diagram,/<svg /);
  assert.match(diagram,/One end of a 20 kilogram bar: 25 kg × 1/);
  assert.match(diagram,/fill="#D85757"/);
  const html=renderPlateLoading(result);
  assert.match(html,/25 kg per side/);
  assert.match(html,/Repeat this arrangement on the other side/);
  assert.match(html,/plates load from the collar outward/);
});
test('calculator is only exposed for weights and does not edit workout values',()=>{
  const keypad=fs.readFileSync('app/src/numericKeypad.js','utf8');
  const sw=fs.readFileSync('app/sw.js','utf8');
  assert.match(keypad,/active\.field!=='weight'/);
  assert.match(keypad,/calculatePlateLoading\(numericDraftValue\(active\.text,'weight'\)\)/);
  assert.match(keypad,/data-plates/);
  assert.match(keypad,/data-loading-back/);
  assert.match(sw,/\.\/src\/plateLoading\.js/);
});
