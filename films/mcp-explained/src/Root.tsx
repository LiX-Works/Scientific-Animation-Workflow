import React from 'react';
import {Composition, continueRender, delayRender, staticFile} from 'remotion';
import {FILM_FRAMES, Film} from './film/Film';
import {H, W} from './lib';

const fontHandle = delayRender('fonts');
Promise.all([
  new FontFace('Inter Tight', `url(${staticFile('fonts/inter-tight.woff2')})`, {weight: '100 900'}).load(),
  new FontFace('JetBrains Mono', `url(${staticFile('fonts/jetbrains-mono.woff2')})`, {weight: '100 800'}).load(),
]).then((fs) => { fs.forEach((x) => document.fonts.add(x)); continueRender(fontHandle); });

export const Root: React.FC = () => <Composition id="Film" component={Film} width={W} height={H} fps={60} durationInFrames={FILM_FRAMES} />;
