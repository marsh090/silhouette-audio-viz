import type { AudioFrame } from './types';

export class AudioAnalyzer {
  private context: AudioContext;
  private analyser: AnalyserNode;
  private buffer: Uint8Array<ArrayBuffer>;
  private source: MediaElementAudioSourceNode | null = null;

  constructor(fftSize = 512) {
    this.context = new AudioContext();
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = fftSize;
    this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.connect(this.context.destination);
  }

  connect(media: HTMLMediaElement): void {
    if (this.source) this.source.disconnect();
    this.source = this.context.createMediaElementSource(media);
    this.source.connect(this.analyser);
  }

  async resume(): Promise<void> {
    if (this.context.state === 'suspended') await this.context.resume();
  }

  getFrame(): AudioFrame {
    this.analyser.getByteFrequencyData(this.buffer);
    return {
      frequencies: Float32Array.from(this.buffer),
      time: this.context.currentTime,
    };
  }
}
