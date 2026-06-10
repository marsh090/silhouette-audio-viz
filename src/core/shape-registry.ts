import circulo from '../../formas/circulo.json';
import linha from '../../formas/linha.json';
import { makeTwoColorGradient } from './color-gradient';
import type { BarDirection, ShapeKind, ShapeLayout, VisualConfig } from './types';

export interface LineGeometry {
  type: 'line';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface CircleGeometry {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

export interface ShapeDefinition {
  id: ShapeKind;
  label: string;
  layout: ShapeLayout;
  geometry: LineGeometry | CircleGeometry;
  defaults: Partial<VisualConfig> & {
    gradientColorStart?: string;
    gradientColorEnd?: string;
    barDirection?: BarDirection;
  };
}

const DEFINITIONS: Record<ShapeKind, ShapeDefinition> = {
  line: linha as ShapeDefinition,
  circle: circulo as ShapeDefinition,
};

export function getShapeDefinition(kind: ShapeKind): ShapeDefinition {
  return DEFINITIONS[kind];
}

export function getAllShapeDefinitions(): ShapeDefinition[] {
  return Object.values(DEFINITIONS);
}

/** Merge global defaults with shape-specific overrides from JSON. */
export function configForShape(global: VisualConfig, kind: ShapeKind): VisualConfig {
  const def = getShapeDefinition(kind);
  const { gradientColorStart, gradientColorEnd, ...rest } = def.defaults;
  const merged: VisualConfig = { ...global, ...rest };

  if (gradientColorStart && gradientColorEnd) {
    merged.gradientColorStart = gradientColorStart;
    merged.gradientColorEnd = gradientColorEnd;
    merged.colorGradient = makeTwoColorGradient(gradientColorStart, gradientColorEnd);
  }

  return merged;
}
