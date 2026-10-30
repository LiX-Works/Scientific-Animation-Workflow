// Builds the timeline: every spoken word's start, in 30 fps film units. Picture and sound both read src/film/timeline.json.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';

const FPS = 30;
const {segments} = JSON.parse(readFileSync('narration.json', 'utf8'));
const LEAD = 1.9, TAIL = 4.4, GAP = 0.28;
const EXTRA = {i1: 0.2, i2: 0.2, l1: 0.55, i3: 0.8, s02: 0.15, s05: 0.15, s08: 0.1, s12: 0.35, s13: 0.05, s14: 0.35, s15: 0.45};

let t = LEAD;
const out = [];
for (const s of segments) {
  const a = JSON.parse(readFileSync(`public/vo/${s.id}.json`, 'utf8'));
  const words = []; let cur = '', st = 0;
  a.chars.forEach((c, i) => {
    if (c === ' ') { if (cur) words.push({w: cur, f: Math.round((t + st) * FPS)}); cur = ''; return; }
    if (!cur) st = a.starts[i];
    cur += c;
  });
  if (cur) words.push({w: cur, f: Math.round((t + st) * FPS)});
  const sentences = s.show.match(/[^.!?]+[.!?]+/g).map((x) => x.trim());
  const spoken = s.say.match(/[^.!?]+[.!?]+/g).map((x) => x.trim());
  let wi = 0; const cues = [];
  sentences.forEach((text, n) => { cues.push({text, f: words[wi].f}); wi += spoken[n].split(/\s+/).length; });
  out.push({id: s.id, from: Math.round(t * FPS), to: Math.round((t + a.end) * FPS), at: t, words, cues});
  t += a.end + GAP + (EXTRA[s.id] || 0);
}
const total = t - GAP + TAIL;
mkdirSync('src/film', {recursive: true});
writeFileSync('src/film/timeline.json', JSON.stringify({frames: Math.ceil(total * FPS), segments: out}));
console.log('seconds', total.toFixed(1));
