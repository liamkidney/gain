import test from 'node:test';
import assert from 'node:assert/strict';
import {lucideIcon} from '../app/src/lucide.js';

test('Lucide navigation and settings icons render as accessible-size inline SVG',()=>{
  for (const name of ['list','clipboard-list','chart-no-axes-combined','settings']) {
    const output=lucideIcon(name,22);
    assert.match(output,/^<svg width="22" height="22"/);
    assert.match(output,/stroke-width="2"/);
    assert.match(output,/<\/(?:svg)>$/);
    assert.match(output,/<(?:path|rect|circle) /);
  }
});
test('Unknown Lucide icon names do not silently render placeholders',()=>{
  assert.throws(()=>lucideIcon('not-an-icon'),/Unknown Lucide icon/);
});
