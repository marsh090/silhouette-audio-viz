import { App } from './ui/app';

const canvas = document.querySelector('#viz') as HTMLCanvasElement;
const controls = document.querySelector('#controls') as HTMLElement;
const playback = document.querySelector('#playback') as HTMLElement;
new App(canvas, controls, playback);
