import { App } from './ui/app';

const canvas = document.querySelector('#viz') as HTMLCanvasElement;
const controls = document.querySelector('#controls') as HTMLElement;
new App(canvas, controls);
