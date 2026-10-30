# Narration-locked animation

The narration is the film's clock. Nothing in the picture or the soundtrack holds a hand-typed time. Each moment is named after the spoken word it hangs on, so the words can change and the film follows.

**`narration.json` → voice takes with character timestamps → `timeline.json` → `events.mjs` → picture and sound**

## 1. Write the narration

`narration.json` holds one entry per take. `say` is what the voice reads, spelled for speech; `show` is the subtitle.

```json
{"id": "s11",
 "say": "It asks Zotero to save the paper in a collection called Solar. But no such collection exists.",
 "show": "It asks Zotero to save the paper in a collection called Solar. But no such collection exists."}
```

Keep the two apart when they differ: `M-C-P` is read letter by letter and shown as `MCP`.

## 2. Generate takes with timing

`scripts/tts.mjs` requests each take from ElevenLabs with character timestamps and saves `public/vo/<id>.mp3` and `<id>.json`. Passing the neighbouring lines as context keeps the delivery continuous. Any speech engine that reports character or word timing can replace it.

## 3. Build the timeline

`scripts/timeline.mjs` lays the takes end to end with gaps and writes `src/film/timeline.json`: every word's start, plus one subtitle cue per sentence. Pauses are set per line in `EXTRA`, so pacing stays an editorial choice.

Times are in 30 fps units even though the film renders at 60 fps. The film uses `f = frame / 2`, so every motion is defined on continuous time, and the frame rate can change without touching a scene.

## 4. Name the events

`src/film/events.mjs` is the only place where time is decided:

```js
send2: from('s11'),            // the line starts
solar: at('s11', 'solar'),     // the word "Solar"
nope:  at('s11', 'no'),        // the word "no"
```

If a word is edited out of the narration, `at()` throws, so a stale cue fails at build time and cannot drift out of sync unnoticed.

## 5. Let picture and sound read the same table

The picture reads `E.nope` to turn the server red. `scripts/mix.mjs` reads the same `E.nope` for its impact and turns the music dissonant until `E.fix`. One event, one definition, two consumers.

Every drawing function takes time as input. Random values come from seeded generators, and nothing reads the clock or remembers the previous frame. That is what allows rendering in parallel, and re-rendering any stretch on its own.

## 6. Check what can be measured, and listen to the rest

- `scripts/stills.mjs` renders chosen frames into one contact sheet, which is the fastest way to review layout and text.
- `scripts/mix.mjs` prints, for every line, how far the voice sits above the music above 1 kHz. Use it to find a line the music is covering. It does not replace listening.
- Rendered clips reveal what stills cannot: reading time, camera speed, and whether a sound lands on its event.

Heavy hits also need care with the words. A cue on the first syllable of a key term can mask it, so this film places its largest hits a few frames before the word.

## Using it for another film

1. Replace `narration.json` and generate takes. Run `npm run timeline`.
2. Rewrite `src/film/events.mjs` around your own words.
3. Write your scenes in `src/film/`, reading times from `E`. `src/lib.tsx` (easing, bloom, type) and `src/draw.ts` (projection, tunnel, rings) are general.
4. Replace the cues in `scripts/mix.mjs`. Its instruments at the top of the file carry over.
5. Run `npm run mix`, `npm run bundle`, `npm run render`.

## What it does not do

Timing follows the words; composition does not. If a line grows a lot, the scene may need a new beat, and that is a design decision. The method also does not write scenes. A new film needs its own explanation, and its own decisions about what each shot shows.
