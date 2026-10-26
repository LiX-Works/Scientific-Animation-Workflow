// Diagnostic: render a sequence (including repeated frames) without resetting the page.
import fs from 'node:fs';
import path from 'node:path';
import { options, number, localPath, serve, launch, readyPage } from './runtime.mjs';
let server, browser;
try {
  const a = options({ frames: 'value', fps: 'value', out: 'value', chrome: 'value', renderer: 'value', raf: 'flag', force: 'flag', help: 'flag', 'no-sandbox': 'flag' });
  if (a.help) { console.log('Usage: node tools/rep.mjs [--frames 2490,2490] [--fps 30] [--out output/repeat] [--renderer software|d3d11|auto] [--chrome executable] [--raf] [--force] [--no-sandbox]\nRenderer default: software; d3d11 is Windows-only.'); process.exit(0); }
  const fps = number(a.fps ?? 30, 'fps', { min: 1, max: 240 });
  const seq = (a.frames || process.env.SEQ || '2490,2490').split(',').map(f => number(f, 'frame number', { integer: true }));
  const out = localPath(a.out || 'output/repeat');
  const files = seq.map((_, i) => path.join(out, `rep${i}.jpg`));
  if (!a.force && files.some(file => fs.existsSync(file))) throw new Error('Diagnostic output exists; use a new directory or --force');
  server = await serve(); browser = await launch(a);
  const { page, timeline, check } = await readyPage(browser, server.url);
  if (seq.some(f => f / fps > timeline.dur)) throw new Error('Frame is beyond the film duration');
  fs.mkdirSync(out, { recursive: true });
  for (let i = 0; i < seq.length; i++) {
    await page.evaluate(t => window.render(t), seq[i] / fps);
    if (a.raf || process.env.RAF) await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
    check();
    await page.screenshot({ path: files[i], type: 'jpeg', quality: 94 });
  }
  console.log(`Wrote ${seq.length} diagnostic frames to ${out}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (browser) await browser.close(); if (server) await server.close(); }
