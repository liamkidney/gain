import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Gain defines shared graphite and copper tokens', () => {
  const css=fs.readFileSync('app/style.css','utf8');
  for (const value of ['--gain-bg:#151819','--gain-raised:#282d2f','--gain-text:#f2f0e9','--gain-accent:#d77850']) {
    assert.ok(css.includes(value),'Missing theme token: '+value);
  }
  assert.match(css,/color-scheme:dark/);
});

test('Charts and movement diagrams match the theme', () => {
  const chart=fs.readFileSync('app/src/charts.js','utf8');
  assert.match(chart,/var\(--gain-accent\)/);
  assert.match(chart,/var\(--gain-divider\)/);
  for (const file of fs.readdirSync('app/assets/exercises').filter(x=>x.endsWith('.svg'))) {
    const svg=fs.readFileSync('app/assets/exercises/'+file,'utf8');
    assert.ok(svg.includes('#d77850'),file+' has no copper accent');
    assert.ok(!svg.includes('#284a42'),file+' retains green strokes');
  }
});

test('PWA browser chrome uses graphite', () => {
  const builder=fs.readFileSync('scripts/build-pages.mjs','utf8');
  assert.match(builder,/background_color:'#151819',theme_color:'#151819'/);
});
