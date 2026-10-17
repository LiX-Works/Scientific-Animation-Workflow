// Frame times are film seconds, after the story-time reading warp.
import fs from 'node:fs';
import path from 'node:path';
import { options, number, localPath, serve, launch, readyPage } from './runtime.mjs';

const help = `Usage: node tools/render.mjs [options]
  --fps 30 --workers 4 --out frames --q 94 --ss 1
  --from 0 --to <film seconds>   Default end: live window.DUR
  --stills 10,50,120            Render selected film times
  --png                        Lossless frames instead of JPEG
  --mb 4                       PNG subframes for tools/mbavg.py
  --plan                       Print the exact frame plan without rendering
  --report <json>               Save the frame plan; refuses overwrite
  --force                      Replace existing generated files
  --chrome <executable>         Or set CHROME_PATH
  --no-sandbox                 Explicit opt-in for isolated Linux containers
Relative output paths are resolved from the film folder. Existing frames are
skipped unless --force; use a separate folder when settings change.`;

let server, browser;
try {
  const a = options({ fps: 'value', workers: 'value', out: 'value', q: 'value', ss: 'value', from: 'value', to: 'value', stills: 'value', mb: 'value', chrome: 'value', report: 'value', png: 'flag', force: 'flag', plan: 'flag', help: 'flag', 'no-sandbox': 'flag' });
  if (a.help) { console.log(help); process.exit(0); }
  const fps = number(a.fps ?? 30, 'fps', { min: 1, max: 240 });
  const workers = number(a.workers ?? 4, 'workers', { min: 1, max: 32, integer: true });
  const ss = number(a.ss ?? 1, 'ss', { min: .25, max: 4 });
  const quality = number(a.q ?? 94, 'q', { min: 1, max: 100, integer: true });
  const mb = number(a.mb ?? 1, 'mb', { min: 1, max: 32, integer: true });
  const from = number(a.from ?? 0, 'from');
  if (a.to !== undefined && number(a.to, 'to') <= from) throw new Error('--to must be after --from');
  if (a.stills !== undefined && (!a.stills.trim() || a.stills.split(',').some(s => !s.trim() || !Number.isFinite(Number(s)) || Number(s) < 0))) throw new Error('--stills must contain comma-separated nonnegative times');
  if (a.stills && (a.from !== undefined || a.to !== undefined)) throw new Error('--stills cannot be combined with --from/--to');
  const out = localPath(a.out || 'frames');
  server = await serve(); browser = await launch(a);
  const first = await readyPage(browser, server.url, ss);
  const end = number(a.to ?? first.timeline.dur, 'to', { max: first.timeline.dur });
  if (from >= end) throw new Error('--from must be before the film end');
  const startFrame = Math.ceil(from * fps - 1e-9), endFrame = Math.ceil(end * fps - 1e-9);
  const jobs = a.stills ? a.stills.split(',').map(Number).map(t => {
    if (t > first.timeline.dur) throw new Error(`Still time ${t} exceeds film duration ${first.timeline.dur}`);
    return { t, base: `still_${t.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')}` };
  }) : Array.from({ length: endFrame - startFrame }, (_, i) => ({ t: (startFrame + i) / fps, base: `f${String(startFrame + i).padStart(5, '0')}` }));
  const plan = { filmDuration: first.timeline.dur, fps, from, to: end, startFrame: a.stills ? null : startFrame, endFrameExclusive: a.stills ? null : endFrame, frameCount: jobs.length, format: mb > 1 ? 'png-subframes' : a.png ? 'png' : 'jpg', subframes: mb, width: Math.round(1920 * ss), height: Math.round(1080 * ss), out };
  console.log(JSON.stringify(plan, null, 2));
  if (a.report) { const file = localPath(a.report); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(plan, null, 2) + '\n', { flag: a.force ? 'w' : 'wx' }); }
  if (!a.plan) {
    fs.mkdirSync(out, { recursive: true });
    const pending = jobs.filter(j => a.force || (mb > 1 ? !fs.existsSync(path.join(out, j.base + '.jpg')) && Array.from({ length: mb }, (_, k) => path.join(out, `${j.base}_s${k}.png`)).some(p => !fs.existsSync(p)) : !fs.existsSync(path.join(out, j.base + (a.png ? '.png' : '.jpg')))));
    let done = 0;
    const t0 = Date.now();
    async function worker(index) {
      const state = index === 0 ? first : await readyPage(browser, server.url, ss);
      for (let j = index; j < pending.length; j += workers) {
        for (let k = 0; k < mb; k++) {
          const job = pending[j], filename = path.join(out, job.base + (mb > 1 ? `_s${k}.png` : a.png ? '.png' : '.jpg'));
          if (!a.force && fs.existsSync(filename)) continue;
          const t = Math.max(0, Math.min(first.timeline.dur, job.t + (mb > 1 ? (k / mb - .5) * (.5 / fps) : 0)));
          await state.page.evaluate(t => window.render(t), t);
          state.check();
          await state.page.screenshot(mb > 1 || a.png ? { path: filename, type: 'png' } : { path: filename, type: 'jpeg', quality });
        }
        if (++done % 25 === 0) console.log(`Rendered ${done}/${pending.length}`);
      }
      await state.page.close();
    }
    await Promise.all(Array.from({ length: Math.min(workers, Math.max(1, pending.length)) }, (_, i) => worker(i)));
    console.log(`Done: ${done} rendered, ${jobs.length - pending.length} existing; ${(Date.now() - t0) / 1000}s`);
    if (mb > 1) console.log(`Average the subframes with: python tools/mbavg.py "${out}"`);
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (browser) await browser.close(); if (server) await server.close(); }
