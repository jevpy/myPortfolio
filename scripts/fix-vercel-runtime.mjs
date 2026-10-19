// @astrojs/vercel 7.x only knows Node 18/20 and falls back to the retired
// nodejs18.x runtime on newer Node. Vercel builds with Node 24 (package.json
// engines), so the generated functions are pinned to the build's Node major.
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const functionsDir = '.vercel/output/functions';
const runtime = `nodejs${process.versions.node.split('.')[0]}.x`;
if (existsSync(functionsDir)) {
  for (const entry of readdirSync(functionsDir)) {
    const file = join(functionsDir, entry, '.vc-config.json');
    if (!existsSync(file)) continue;
    const config = JSON.parse(readFileSync(file, 'utf8'));
    if (config.runtime === runtime) continue;
    config.runtime = runtime;
    writeFileSync(file, JSON.stringify(config, null, 2));
    console.log(`${file}: runtime -> ${runtime}`);
  }
}
