import { AudioAnalyzer } from '../core/audio-analyzer';
import { DEFAULT_VISUAL_CONFIG } from '../core/defaults';
import { configForShape, getShapeDefinition } from '../core/shape-registry';
import { emissionFromDefinition } from '../core/shape-providers/shape-provider';
import { SpectrumMapper } from '../core/spectrum-mapper';
import type { ShapeKind, VisualConfig } from '../core/types';
import { loadMediaFile } from '../media/media-source';
import { FramePipeline } from '../pipeline/frame-pipeline';
import { BarsRenderer } from '../render/bars-renderer';
import { mountControls, syncControls } from './controls';
import { mountPlaybackBar, type PlaybackBarHandle } from './playback-bar';

export class App {
  private config: VisualConfig;
  private shape: ShapeKind = 'circle';
  private analyzer = new AudioAnalyzer();
  private mapper: SpectrumMapper;
  private renderer = new BarsRenderer();
  private pipeline: FramePipeline;
  private media: HTMLMediaElement | null = null;
  private playbackBar: PlaybackBarHandle;
  private playing = false;
  private controlsEl: HTMLElement;

  constructor(
    private canvas: HTMLCanvasElement,
    controlsEl: HTMLElement,
    playbackEl: HTMLElement,
  ) {
    this.controlsEl = controlsEl;
    this.config = configForShape({ ...DEFAULT_VISUAL_CONFIG }, this.shape);
    this.mapper = new SpectrumMapper(this.config);

    this.playbackBar = mountPlaybackBar(
      playbackEl,
      (time) => this.seek(time),
      () => void this.togglePlay(),
    );
    this.pipeline = new FramePipeline(() => this.tick());
    mountControls(controlsEl, this.config, this.shape, {
      onConfigChange: (patch) => {
        this.config = { ...this.config, ...patch };
        this.mapper.updateConfig(this.config);
      },
      onShapeChange: (s) => this.applyShape(s),
      onMediaFile: (f) => void this.loadMedia(f),
    });
  }

  private applyShape(shape: ShapeKind): void {
    this.shape = shape;
    this.config = configForShape({ ...DEFAULT_VISUAL_CONFIG }, shape);
    this.mapper.updateConfig(this.config);
    syncControls(this.controlsEl, this.config, shape);
  }

  private async loadMedia(file: File): Promise<void> {
    if (this.media) {
      this.media.pause();
      this.pipeline.stop();
    }
    this.media = await loadMediaFile(file);
    this.bindMediaEvents(this.media);
    this.analyzer.connect(this.media);
    this.playing = false;
    this.playbackBar.setPlaying(false);
    this.playbackBar.update(0, this.media.duration);
    this.playbackBar.setEnabled(true);
  }

  private bindMediaEvents(media: HTMLMediaElement): void {
    media.addEventListener('ended', () => {
      this.playing = false;
      this.playbackBar.setPlaying(false);
      this.pipeline.stop();
    });
    media.addEventListener('pause', () => {
      if (media.ended) return;
      this.playing = false;
      this.playbackBar.setPlaying(false);
      this.pipeline.stop();
    });
    media.addEventListener('play', () => {
      this.playing = true;
      this.playbackBar.setPlaying(true);
      this.pipeline.start();
    });
  }

  private seek(time: number): void {
    if (!this.media) return;
    this.media.currentTime = time;
    this.playbackBar.update(time, this.media.duration);
  }

  private async togglePlay(): Promise<void> {
    if (!this.media) return;
    if (this.playing) {
      this.media.pause();
      return;
    }
    await this.analyzer.resume();
    await this.media.play();
  }

  private tick(): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    if (this.media) {
      this.playbackBar.update(this.media.currentTime, this.media.duration);
    }

    const def = getShapeDefinition(this.shape);
    const source = emissionFromDefinition(def, this.config);
    const audioFrame = this.analyzer.getFrame();
    const mapped = this.mapper.map(audioFrame);
    this.renderer.draw(ctx, source, mapped, this.config, this.canvas.width, this.canvas.height);
  }
}
