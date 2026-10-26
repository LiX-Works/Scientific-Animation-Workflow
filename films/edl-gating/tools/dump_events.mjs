import fs from 'node:fs';
import path from 'node:path';
import { options, localPath, serve, launch, readyPage } from './runtime.mjs';
let server, browser;
try {
  const a = options({ out: 'value', chrome: 'value', renderer: 'value', force: 'flag', help: 'flag', 'no-sandbox': 'flag' });
  if (a.help) { console.log('Usage: node tools/dump_events.mjs [--out src/timeline.json] [--force] [--chrome executable] [--renderer software|d3d11|auto] [--no-sandbox]\nUses an automatic local server and waits for document fonts. Existing timelines require --force. Renderer default: software; d3d11 is Windows-only.'); process.exit(0); }
  const out = localPath(a.out || 'src/timeline.json');
  if (fs.existsSync(out) && !a.force) throw new Error('Timeline exists. Use --force to replace this generated file.');
  server = await serve(); browser = await launch(a);
  const { timeline } = await readyPage(browser, server.url);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, JSON.stringify(timeline, null, 2) + '\n', { flag: a.force ? 'w' : 'wx' });
  console.log(`Wrote ${timeline.events.length} events; ${timeline.dur}s to ${out}`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { if (browser) await browser.close(); if (server) await server.close(); }
