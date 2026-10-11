import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

async function loadTs(path, replacements = []) {
  let source = await fs.readFile(path, 'utf8');
  for (const [from, to] of replacements) source = source.replace(from, to);
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(js).toString('base64')}`);
}
const pigments = await loadTs('src/lib/pigmentMixing.ts');
const similarity = (a, b) => pigments.calculatePigmentMatch(
  pigments.createPigmentColor(a), pigments.createPigmentColor(b)
);
for (const hex of ['#F5D5B8', '#B98562', '#382725']) {
  assert.equal(similarity(hex, hex), 100);
  assert.ok(similarity(hex, '#FFFFFF') < 100);
}
// Original pigment behavior is intentional; only the second scaling was removed.
assert.ok(Math.abs(similarity('#382725', '#F5D5B8') - 81.22933329009506) < 1e-9);
assert.ok(Math.abs(similarity('#000000', '#FFFFFF') - 73.15293912756837) < 1e-9);
const dark = pigments.createPigmentColor('#382725');
assert.equal(pigments.createLightFromDark(dark).isRecreated, true);

const { skinRegionsForFaces, detectSkinRegions } = await loadTs('src/lib/localSkinRegions.ts');
assert.throws(() => skinRegionsForFaces([], 500, 500), /exactly one/);
const face = {
  boundingBox: { x: 100, y: 50, width: 200, height: 300 },
  landmarks: [{ type: 'eye', locations: [{ x: 160, y: 160 }, { x: 240, y: 160 }] }]
};
assert.throws(() => skinRegionsForFaces([face, face], 500, 500), /exactly one/);
assert.throws(() => skinRegionsForFaces([{ ...face, landmarks: [] }], 500, 500), /both eyes/);
const regions = skinRegionsForFaces([face], 500, 500);
assert.equal(regions.length, 3);
assert.ok(regions.every(r => r.x > 100 && r.x + r.width < 300));
assert.ok(regions.every(r => !(160 >= r.y && 160 <= r.y + r.height)));
await assert.rejects(detectSkinRegions({ width: 500, height: 500 }), /unavailable/);

// Execute the actual edge handler with a mocked database, without network or deployment.
let handler;
let rows = [];
const query = { select() { return this; }, not() { return this; }, async limit() { return { data: rows, error: null }; } };
globalThis.Deno = { env: { get: () => 'test' }, serve: fn => { handler = fn; } };
globalThis.__testClient = { auth: { getClaims: async () => ({ data: { claims: { sub: 'user' } } }) }, from: () => query };
const edgeColorJs = ts.transpileModule(await fs.readFile('supabase/functions/match-foundations/color.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.ESNext }
}).outputText;
await loadTs('supabase/functions/match-foundations/index.ts', [
  ["import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';", 'const createClient = () => globalThis.__testClient;'],
  ["'./color.ts'", JSON.stringify(`data:text/javascript;base64,${Buffer.from(edgeColorJs).toString('base64')}`)]
]);
const request = body => handler(new Request('https://example.test', {
  method: 'POST', headers: { Authorization: 'Bearer test' }, body: JSON.stringify(body)
}));
assert.equal((await request({ user_hex: 'bad input' })).status, 400);
assert.equal((await request({ user_hex: '#E5C19E', n_results: 0 })).status, 400);
assert.deepEqual((await (await request({ user_hex: '#E5C19E' })).json()).top_matches, []);
rows = [
  { brand: 'Test', name: 'Cool', 'Swatch: imgSrc': '#E5C19E' },
  { brand: 'Test', name: 'Warm', 'Swatch: imgSrc': '#E5C19E' },
  { brand: 'Test', name: 'Invalid', 'Swatch: imgSrc': 'https://image.test/swatch.jpg' }
];
const result = await (await request({ user_hex: '#E5C19E' })).json();
assert.equal(result.top_matches.length, 2);
assert.equal(result.top_matches[0].shade_name, 'Warm');
assert.ok(result.top_matches[1].score > result.top_matches[0].score);
console.log('Foundation regression checks passed: colors, facial regions, validation, empty catalog, undertone ranking.');
