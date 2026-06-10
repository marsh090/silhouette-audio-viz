import { AudioAnalyzer } from '../core/audio-analyzer';
import { SpectrumMapper } from '../core/spectrum-mapper';
import { CircleProvider } from '../core/shape-providers/circle-provider';
import { LineProvider } from '../core/shape-providers/line-provider';
import { DEFAULT_VISUAL_CONFIG, type ShapeKind, type VisualConfig } from '../core/types';
import { loadAudioFile } from '../media/audio-source';
import { FramePipeline } from '../pipeline/frame-pipeline';
import { BarsRenderer } from '../render/bars-renderer';
import { mountControls } from './controls';

export class App {
  private config: VisualConfig = { ...DEFAULT_VISUAL_CONFIG };
  private shape: ShapeKind = 'circle';
  private analyzer = new AudioAnalyzer();
  private mapper = new SpectrumMapper(this.config);
  private renderer = new BarsRenderer();
  private lineProvider = new LineProvider();
  private circleProvider = new CircleProvider();
  private pipeline: FramePipeline;
  private audio: HTMLAudioElement | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    controlsEl: HTMLElement,
  ) {
    this.pipeline = new FramePipeline(() => this.tick());
    mountControls(controlsEl, this.config, {
      onConfigChange: (patch) => {
        this.config = { ...this.config, ...patch };
        this.mapper.updateConfig(this.config);
      },
      onShapeChange: (s) => {
        this.shape = s;
      },
      onAudioFile: (f) => void this.loadAudio(f),
      onPlay: () => void this.play(),
      onPause: () => this.pause(),
    });
  }

  private getProvider() {
    return this.shape === 'line' ? this.lineProvider : this.circleProvider;
  }

  private async loadAudio(file: File): Promise<void> {
    this.audio = await loadAudioFile(file);
    this.analyzer.connect(this.audio);
  }

  private async play(): Promise<void> {
    await this.analyzer.resume();
    await this.audio?.play();
    this.pipeline.start();
  }

  private pause(): void {
    this.audio?.pause();
    this.pipeline.stop();
  }

  private tick(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const source = this.getProvider().getEmissionSource(this.config);
    const audioFrame = this.analyzer.getFrame();
    const mapped = this.mapper.map(audioFrame);
    this.renderer.draw(ctx, source, mapped, this.config, this.canvas.width, this.canvas.height);
  }
}
