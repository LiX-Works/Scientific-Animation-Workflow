// Every story moment, in 30 fps film frames, derived from when the words are spoken. Picture and sound share it.
export const buildEvents = (tl) => {
  const S = Object.fromEntries(tl.segments.map((s) => [s.id, s]));
  const at = (id, word, nth = 0) => {
    const hits = S[id].words.filter((w) => w.w.toLowerCase().replace(/[^a-z0-9/-]/g, '').startsWith(word.toLowerCase()));
    if (!hits[nth]) throw new Error(`no word ${word} in ${id}`);
    return hits[nth].f;
  };
  const from = (id) => S[id].from, to = (id) => S[id].to;
  const E = {
    frames: tl.frames,
    ignite: from('i1') - 26,
    pull: [from('i1') + 18, at('i1', 'cant') + 4], strikes: [at('i1', 'open'), at('i1', 'file'), at('i1', 'run'), at('i1', 'program'), to('i1') - 2, to('i1') + 8],
    gui: from('i2') - 8, menus: at('i2', 'menus'), dialogs: at('i2', 'dialogs'), buttons: at('i2', 'buttons'), slow: at('i2', 'slow'), brk: at('i2', 'break'),
    tilt: at('l1', 'window') - 6, lCmd: at('l1', 'commands'), lScript: at('l1', 'scripting'), lCore: at('l1', 'core'),
    title: from('i3') - 12, pack: at('i3', 'package'), tools: at('i3', 'tools'), late: from('i3') + 24,
    stage: to('i3') + 16,
    prompt: at('s02', 'find'),
    list: at('s03', 'asks'), srv: at('s03', 'server', 1), front: at('s03', 'front'),
    rush: from('s04') - 4, hero: at('s04', 'text') - 2, cardName: at('s04', 'name'), cardDoes: at('s04', 'does'), cardInputs: at('s04', 'inputs'),
    ctx: from('s05'), you: at('s05', 'request'),
    key: from('s06'), wall: at('s06', 'touch'), write: at('s06', 'write'),
    req1: from('s07') + 2, reqTool: at('s07', 'tool'), reqInputs: at('s07', 'inputs'),
    relay: from('s08'), wrap: at('s08', 'message'), tcall: at('s08', 'tools'),
    run: from('s09'), dive: at('s09', 'turns') + 6, work: at('s09', 'work'), back: at('s09', 'result'),
    read: at('s10', 'read'), pick: at('s10', 'pick'), doi: at('s10', 'd-o-i'), req2: at('s10', 'next'),
    send2: from('s11'), solar: at('s11', 'solar'), nope: at('s11', 'no'),
    err: from('s12'), naming: at('s12', 'naming'), fix: at('s12', 'fixes'), retry: at('s12', 'tries'),
    nothing: from('s13'), more: at('s14', 'connect'), longer: at('s14', 'longer'),
    tan: from('s15') - 6, snap2: at('s15', 'with', 1) - 9, oneSrv: at('s15', 'one', 1), everyApp: at('s15', 'every'),
    end: from('s16') - 8, wList: at('s16', 'list'), wCall: at('s16', 'call'), wRead: at('s16', 'read'), wRepeat: at('s16', 'repeat'),
    outro: to('s16') + 10,
  };
  E.arrive2 = E.err + 22; E.retryDone = E.retry + 26;
  return E;
};
// Message routes as [start frame, frames per leg, kind]; the picture adds the geometry.
export const hops = (E) => ({
  list: [E.list, 18], back: [E.rush - 10, 12], reqA: [E.relay + 2, 20], reqB: [E.run - 10, 16],
  res: [E.back, 7], add: [E.send2 + 2, Math.max(8, (E.solar - E.send2) / 3)], bad: [E.err, 7], again: [E.retry - 4, 10],
});
