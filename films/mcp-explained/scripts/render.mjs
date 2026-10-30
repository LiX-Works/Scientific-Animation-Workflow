// Full export: renders the silent picture, then muxes it with public/mix.wav into out/mcp-explained.mp4.
// Run `npm run bundle` and `npm run mix` first.
import {execFileSync} from 'node:child_process';
import {mkdirSync} from 'node:fs';

mkdirSync('out', {recursive: true});
execFileSync('npx', ['remotion', 'render', 'build', 'Film', 'out/silent.mp4', '--muted', '--concurrency=8', '--crf=15', '--log=error'], {stdio: 'inherit', shell: true});
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', 'out/silent.mp4', '-i', 'public/mix.wav', '-vf', 'scale=in_range=full:out_range=tv,format=yuv420p', '-color_range', 'tv', '-c:v', 'libx264', '-preset', 'slow', '-crf', '21', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', 'out/mcp-explained.mp4'], {stdio: 'inherit'});
console.log('wrote out/mcp-explained.mp4');
