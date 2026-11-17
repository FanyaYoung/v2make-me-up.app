import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ts from 'typescript';

const toModuleUrl = async (filename, replacements = []) => {
  let text = await fs.readFile(filename, 'utf8');
  for (const [before, after] of replacements) {
    if (!text.includes(before)) throw new Error('Expected import not found: ' + before);
    text = text.replace(before, after);
  }
  const compiled = ts.transpileModule(text, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 }
  }).outputText;
  return 'data:text/javascript;base64,' + Buffer.from(compiled).toString('base64');
};

const colorUtilsUrl = await toModuleUrl('src/lib/colorUtils.ts');
const guardUrl = await toModuleUrl('src/lib/shadeDepthGuard.ts', [
  ["'./colorUtils'", JSON.stringify(colorUtilsUrl)]
]);
const { isShadeDepthCompatible, areSkinZoneDepthsPlausible, getPerceptualLightness } = await import(guardUrl);

assert.equal(isShadeDepthCompatible('#38241E', '#F5E4CB'), false, 'Deep skin must reject ivory');
assert.equal(isShadeDepthCompatible('#38241E', '#F7DBC9'), false, 'Deep skin must reject porcelain');
assert.equal(isShadeDepthCompatible('#6B4B3B', '#F5E4CB'), false, 'Dark-center skin must reject ivory');
assert.equal(isShadeDepthCompatible('#38241E', '#392B27'), true, 'Deep skin should allow comparable dark shades');
assert.equal(isShadeDepthCompatible('#6B4B3B', '#6A4A3A'), true, 'Dark-center skin should allow close matches');
assert.equal(isShadeDepthCompatible('#E7C5AD', '#E7C5AD'), true, 'Exact match must pass');
assert.equal(isShadeDepthCompatible('invalid', '#E7C5AD'), false);
assert.equal(isShadeDepthCompatible('#38241E', 'invalid'), false);
assert.equal(areSkinZoneDepthsPlausible('#6B4B3B', '#38241E'), true);
assert.equal(areSkinZoneDepthsPlausible('#F5E4CB', '#38241E'), false, 'Extreme apparent facial contrast is invalid');
assert.equal(areSkinZoneDepthsPlausible('#38241E', '#6B4B3B'), false, 'Lightest must not be darker than darkest');
assert.ok(getPerceptualLightness('#F5E4CB') > getPerceptualLightness('#38241E'));

const component = await fs.readFile('src/components/AISkinToneMatcher.tsx', 'utf8');
assert.match(component, /\.filter\(shade => isShadeDepthCompatible\(lightHex, shade\.hex\)\)/);
assert.match(component, /\.filter\(shade => isShadeDepthCompatible\(darkHex, shade\.hex\)\)/);
assert.match(component, /const bestLight = lightMatches\[0\]/);
assert.match(component, /const bestDark = darkMatches\[0\]/);
assert.doesNotMatch(component, /find\(m => m\.shade\.imgSrc\)/, 'Image presence must not override color rank');
assert.match(component, /areSkinZoneDepthsPlausible\(lightestHex, darkestHex\)/);

console.log('Foundation depth safeguard regression checks passed.');
