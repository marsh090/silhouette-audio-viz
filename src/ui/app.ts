import { AudioAnalyzer } from '../core/audio-analyzer';
import { getInitialConfig, savePreset } from '../core/config-store';
import { getShapeDefinition } from '../core/shape-registry';
import { emissionFromDefinition } from '../core/shape-providers/shape-provider';
import {
  emissionFromImage,
  emissionFromMask,
  emptyMaskEmissionSource,
} from '../core/shape-providers/image-mask-provider';
import { loadImageFile } from '../core/image-preprocess';
import { SpectrumMapper } from '../core/spectrum-mapper';
import type { EmissionSource, MaskGrid, ShapeKind, VisualConfig } from '../core/types';
import { loadMediaFile } from '../media/media-source';
import { FramePipeline } from '../pipeline/frame-pipeline';
import { Visualizer } from '../render/visualizer';
import { mountControls, syncControls } from './controls';
import { mountPlaybackBar, type PlaybackBarHandle } from './playback-bar';

export class App {
  private config: VisualConfig;
  private shape: ShapeKind = 'circle';
  private analyzer = new AudioAnalyzer();
  private mapper: SpectrumMapper;
  private visualizer = new Visualizer();
  private pipeline: FramePipeline;
  private media: HTMLMediaElement | null = null;
  private image: HTMLImageElement | null = null;
  private imageMask: MaskGrid | null = null;
  private imageSource: EmissionSource | null = null;
  private playbackBar: PlaybackBarHandle;
  private playing = false;
  private controlsEl: HTMLElement;

  constructor(
    private canvas: HTMLCanvasElement,
    controlsEl: HTMLElement,
    playbackEl: HTMLElement,
  ) {
    this.controlsEl = controlsEl;
    this.config = getInitialConfig('circle', 'bars');
    this.mapper = new SpectrumMapper(this.config);

    this.playbackBar = mountPlaybackBar(
      playbackEl,
      (time) => this.seek(time),
      () => void this.togglePlay(),
    );
    this.pipeline = new FramePipeline((dt) => this.tick(dt));
    mountControls(controlsEl, this.config, this.shape, {
      onConfigChange: (patch) => {
        this.config = { ...this.config, ...patch };
        this.mapper.updateConfig(this.config);
        if (patch.renderMode) syncControls(this.controlsEl, this.config, this.shape);
        if (this.shape === 'image' && this.image) {
          if (
            patch.maskThreshold !== undefined ||
            patch.maskBlur !== undefined ||
            patch.maskInvert !== undefined
          ) {
            this.rebuildImageSource();
          }
          this.redraw();
        } else if (
          patch.barNormalMode !== undefined ||
          patch.barNormalBlend !== undefined ||
          patch.barNormalSmooth !== undefined ||
          patch.pointCount !== undefined
        ) {
          this.redraw();
        }
      },
      onShapeChange: (s) => this.applyShape(s),
      onMediaFile: (f) => void this.loadMedia(f),
      onImageFile: (f) => void this.loadImage(f),
      onSavePreset: () => this.saveCurrentPreset(),
    });
  }

  private applyShape(shape: ShapeKind): void {
    this.shape = shape;
    syncControls(this.controlsEl, this.config, shape);
    if (shape === 'image') this.rebuildImageSource();
    this.redraw();
  }

  private saveCurrentPreset(): void {
    savePreset(this.shape, this.config.renderMode, this.config);
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

  private async loadImage(file: File): Promise<void> {
    this.image = await loadImageFile(file);
    this.rebuildImageSource();
    this.redraw();
  }

  private rebuildImageSource(): void {
    if (!this.image) {
      this.imageMask = null;
      this.imageSource = emptyMaskEmissionSource();
      return;
    }

    this.imageSource = emissionFromImage(this.image, this.config);
    this.imageMask = this.imageSource.mask ?? null;
  }

  private getEmissionSource(): EmissionSource {
    if (this.shape === 'image') {
      if (this.imageMask) {
        return emissionFromMask(this.imageMask, this.config);
      }
      return this.imageSource ?? emptyMaskEmissionSource();
    }

    const def = getShapeDefinition(this.shape);
    return emissionFromDefinition(def, this.config);
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

  private redraw(): void {
    this.tick(1 / 60);
  }

  private tick(dt: number): void {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    if (this.media) {
      this.playbackBar.update(this.media.currentTime, this.media.duration);
    }

    const source = this.getEmissionSource();
    const audioFrame = this.analyzer.getFrame();
    const mapped = this.mapper.map(audioFrame, dt);
    this.visualizer.draw(ctx, source, mapped, this.config, this.canvas.width, this.canvas.height);
  }
}
