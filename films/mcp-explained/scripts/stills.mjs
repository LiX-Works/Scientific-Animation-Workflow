// Contact sheet of chosen film frames: node scripts/stills.mjs out.jpg 4 0.25 10 40 90 ...   (needs a fresh `npm run bundle`)
import {execFileSync} from 'node:child_process';
import {mkdirSync, rmSync} from 'node:fs';
import path from 'node:path';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';

const [out, cols, scale, ...frames] = process.argv.slice(2);
const serveUrl = path.resolve('build');
const tmp = path.resolve('out/_stills');
rmSync(tmp, {recursive: true, force: true}); mkdirSync(tmp, {recursive: true});
const chromiumOptions = {gl: 'angle'};
const browser = await openBrowser('chrome', {chromiumOptions});
const composition = await selectComposition({serveUrl, id: 'Film', puppeteerInstance: browser, chromiumOptions});
let i = 0;
for (const fr of frames) {
  await renderStill({composition, serveUrl, frame: Number(fr), output: path.join(tmp, `f_${String(i++).padStart(3, '0')}.jpg`), imageFormat: 'jpeg', jpegQuality: 88, scale: Number(scale), puppeteerInstance: browser, chromiumOptions});
}
await browser.close({silent: true});
const rows = Math.ceil(frames.length / Number(cols));
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(tmp, 'f_%03d.jpg'), '-frames:v', '1', '-update', '1', '-q:v', '3', '-filter:v', `tile=${cols}x${rows}:padding=4:color=gray`, out]);
console.log('ok', out, frames.length);
