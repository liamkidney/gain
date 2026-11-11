import test from 'node:test';
import assert from 'node:assert/strict';
import {shouldCommitBackSwipe} from '../app/src/backSwipe.js';
test('short edge drags cancel, deliberate right swipes navigate back',()=>{
  assert.equal(shouldCommitBackSwipe(20,390),false);
  assert.equal(shouldCommitBackSwipe(106,390),true);
  assert.equal(shouldCommitBackSwipe(80,240),true);
  assert.equal(shouldCommitBackSwipe(50,240),false);
});
