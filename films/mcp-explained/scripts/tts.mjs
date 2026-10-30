// Generates the narration, one take per segment of narration.json, with word timing.
//   ELEVENLABS_API_KEY=... node scripts/tts.mjs --voices
//   ELEVENLABS_API_KEY=... node scripts/tts.mjs --voice <id> [--seg i1,i2]
// Writes public/vo/<id>.mp3 and public/vo/<id>.json. The takes used in the film are already in public/vo, so you
// only need this (and a key) if you change the words. On networks that need a proxy, set HTTPS_PROXY.
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';

if (process.env.NODE_USE_ENV_PROXY !== '1') {
  const {spawnSync} = await import('node:child_process');
  const r = spawnSync(process.execPath, process.argv.slice(1), {stdio: 'inherit', env: {...process.env, NODE_USE_ENV_PROXY: '1'}});
  process.exit(r.status ?? 1);
}
const argv = process.argv.slice(2);
const opt = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) { console.error('Set ELEVENLABS_API_KEY.'); process.exit(1); }
const get = async (p) => { const r = await fetch(`https://api.elevenlabs.io${p}`, {headers: {'xi-api-key': KEY}}); if (!r.ok) { console.error(`GET ${p}: ${r.status}`); process.exit(1); } return r.json(); };

if (argv.includes('--voices')) {
  const v = await get('/v1/voices');
  for (const x of v.voices.filter((q) => q.category === 'premade')) {
    const l = x.labels || {};
    console.log(`${x.voice_id}  ${x.name.split(' - ')[0].padEnd(10)} ${[l.gender, l.age, l.accent, l.use_case, l.descriptive].filter(Boolean).join(', ')}`);
  }
  process.exit(0);
}

// The film's voice: the preset "Alice", with these settings.
const VOICE = opt('voice', 'Xb7hH8MSUJpSbSDYk0k2');
const {segments} = JSON.parse(readFileSync('narration.json', 'utf8'));
const want = opt('seg')?.split(',');
mkdirSync('public/vo', {recursive: true});
for (const [i, s] of segments.entries()) {
  if (want && !want.includes(s.id)) continue;
  const body = {
    text: s.say, model_id: 'eleven_multilingual_v2',
    previous_text: segments[i - 1]?.say, next_text: segments[i + 1]?.say,
    voice_settings: {stability: 0.42, similarity_boost: 0.75, style: 0.28, speed: 1.1},
  };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {method: 'POST', headers: {'xi-api-key': KEY, 'Content-Type': 'application/json'}, body: JSON.stringify(body)});
  if (!res.ok) { console.error(`FAILED ${s.id}: ${res.status} ${(await res.text()).slice(0, 300)}`); process.exit(1); }
  const j = await res.json();
  writeFileSync(`public/vo/${s.id}.mp3`, Buffer.from(j.audio_base64, 'base64'));
  const a = j.alignment;
  writeFileSync(`public/vo/${s.id}.json`, JSON.stringify({id: s.id, say: s.say, show: s.show, end: a.character_end_times_seconds.at(-1), chars: a.characters, starts: a.character_start_times_seconds, ends: a.character_end_times_seconds}));
  console.log(s.id, a.character_end_times_seconds.at(-1).toFixed(2), 's');
}
