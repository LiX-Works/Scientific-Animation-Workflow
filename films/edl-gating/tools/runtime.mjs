// Local rendering support. No global server or current-directory assumptions.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const localPath = value => path.resolve(ROOT, value);

export function options(definitions, argv = process.argv.slice(2)) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    const name = argv[i].replace(/^--/, '');
    if (!argv[i].startsWith('--') || !(name in definitions)) throw new Error(`Unknown option: ${argv[i]}`);
    if (definitions[name] === 'flag') {
      result[name] = true;
      if (argv[i + 1] === '1' || argv[i + 1] === '0') result[name] = argv[++i] === '1';
    } else {
      if (!argv[i + 1] || argv[i + 1].startsWith('--')) throw new Error(`--${name} needs a value`);
      result[name] = argv[++i];
    }
  }
  return result;
}

export function number(value, label, { min = 0, max = Infinity, integer = false } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < min || n > max || (integer && !Number.isInteger(n))) throw new Error(`${label} must be ${integer ? 'an integer' : 'a number'} in [${min}, ${max}]`);
  return n;
}

export function chromePath(explicit) {
  const selected = explicit || process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (selected) {
    if (!fs.existsSync(selected)) throw new Error(`Browser executable not found: ${selected}`);
    return selected;
  }
  const candidates = process.platform === 'win32' ? [
    path.join(process.env.PROGRAMFILES || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    path.join(process.env.PROGRAMFILES || '', 'Microsoft/Edge/Application/msedge.exe'),
    path.join(process.env['PROGRAMFILES(X86)'] || '', 'Microsoft/Edge/Application/msedge.exe'),
  ] : process.platform === 'darwin' ? [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ] : ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium', '/usr/bin/chromium-browser'];
  for (const dir of (process.env.PATH || '').split(path.delimiter)) {
    for (const exe of process.platform === 'win32' ? ['chrome.exe', 'msedge.exe'] : ['google-chrome', 'chromium']) candidates.push(path.join(dir, exe));
  }
  const found = candidates.find(p => fs.existsSync(p) && fs.statSync(p).isFile());
  if (!found) throw new Error('Chrome/Chromium not found. Set CHROME_PATH or pass --chrome <executable>.');
  return found;
}

export async function serve(port = 0) {
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg' };
  const server = http.createServer((req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(ROOT, `.${pathname === '/' ? '/src/index.html' : pathname}`);
      if (!file.startsWith(ROOT + path.sep) || !['GET', 'HEAD'].includes(req.method)) { res.writeHead(403).end(); return; }
      fs.stat(file, (error, stat) => {
        if (error || !stat.isFile()) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Length': stat.size });
        if (req.method === 'HEAD') res.end();
        else fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
      });
    } catch { res.writeHead(400).end(); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise(resolve => server.close(resolve)) };
}

export async function launch(args) {
  const flags = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--hide-scrollbars', '--window-size=1920,1080'];
  if (args['no-sandbox']) flags.push('--no-sandbox');
  return puppeteer.launch({ executablePath: chromePath(args.chrome), headless: true, args: flags });
}

export async function readyPage(browser, url, scale = 1) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: scale });
  await page.goto(`${url}/src/index.html?ss=${scale}`, { waitUntil: 'networkidle0', timeout: 120000 });
  await page.waitForFunction(() => window.READY === true, { timeout: 120000 });
  await page.evaluate(() => document.fonts.ready);
  const timeline = await page.evaluate(() => ({ dur: window.DUR, story: window.WARP.S.at(-1), warp: window.WARP, events: window.EV }));
  if (errors.length) throw new Error(`Page error: ${errors.join('; ')}`);
  if (!(Number.isFinite(timeline.dur) && timeline.dur > 0 && timeline.warp && Array.isArray(timeline.events))) throw new Error('Film did not expose a valid DUR/WARP/EV timeline');
  return { page, timeline, check: () => { if (errors.length) throw new Error(`Page error: ${errors.join('; ')}`); } };
}
