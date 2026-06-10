import { makeTwoColorGradient } from './color-gradient';
import { DEFAULT_VISUAL_CONFIG } from './defaults';
import { getShapeDefinition } from './shape-registry';
import type { ShapeKind, VisualConfig } from './types';

const STORAGE_KEY = 'silhouette-viz-presets';

export type PresetKey = `${ShapeKind}:${VisualConfig['renderMode']}`;

export function presetKey(shape: ShapeKind, mode: VisualConfig['renderMode']): PresetKey {
  return `${shape}:${mode}`;
}

type StoredPresets = Partial<Record<PresetKey, Omit<VisualConfig, 'colorGradient'>>>;

function rebuildGradient(config: Omit<VisualConfig, 'colorGradient'> & Partial<VisualConfig>): VisualConfig {
  const { gradientColorStart, gradientColorEnd } = config;
  return {
    ...config,
    colorGradient: makeTwoColorGradient(gradientColorStart, gradientColorEnd),
  } as VisualConfig;
}

function readAll(): StoredPresets {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredPresets) : {};
  } catch {
    return {};
  }
}

function writeAll(presets: StoredPresets): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

/** Fallback from formas/*.json when no saved preset exists. */
export function configFromJsonDefaults(shape: ShapeKind, mode: VisualConfig['renderMode']): VisualConfig {
  const def = getShapeDefinition(shape);
  const { gradientColorStart, gradientColorEnd, ...rest } = def.defaults;
  const merged = { ...DEFAULT_VISUAL_CONFIG, ...rest, renderMode: mode };

  if (gradientColorStart && gradientColorEnd) {
    merged.gradientColorStart = gradientColorStart;
    merged.gradientColorEnd = gradientColorEnd;
  }

  return rebuildGradient(merged);
}

export function loadPreset(shape: ShapeKind, mode: VisualConfig['renderMode']): VisualConfig | null {
  const stored = readAll()[presetKey(shape, mode)];
  if (!stored) return null;
  return rebuildGradient({ ...DEFAULT_VISUAL_CONFIG, ...stored, renderMode: mode });
}

export function savePreset(shape: ShapeKind, mode: VisualConfig['renderMode'], config: VisualConfig): void {
  const presets = readAll();
  const { colorGradient: _, ...serializable } = config;
  presets[presetKey(shape, mode)] = { ...serializable, renderMode: mode };
  writeAll(presets);
}

export function getInitialConfig(
  shape: ShapeKind,
  mode: VisualConfig['renderMode'],
): VisualConfig {
  return loadPreset(shape, mode) ?? configFromJsonDefaults(shape, mode);
}
