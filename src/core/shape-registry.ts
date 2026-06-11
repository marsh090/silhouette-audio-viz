import circulo from '../../formas/circulo.json';
import linha from '../../formas/linha.json';
import imagem from '../../formas/imagem.json';
import quadrado from '../../formas/quadrado.json';
import triangulo from '../../formas/triangulo.json';
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

export interface PolygonGeometry {
  type: 'polygon';
  cx: number;
  cy: number;
  r: number;
  sides: number;
  rotation?: number;
}

export interface ImageGeometry {
  type: 'image';
}

export interface ShapeDefinition {
  id: ShapeKind;
  label: string;
  layout: ShapeLayout;
  geometry: LineGeometry | CircleGeometry | PolygonGeometry | ImageGeometry;
  defaults: Partial<VisualConfig> & {
    gradientColorStart?: string;
    gradientColorEnd?: string;
    barDirection?: BarDirection;
  };
}

const DEFINITIONS: Record<ShapeKind, ShapeDefinition> = {
  line: linha as ShapeDefinition,
  circle: circulo as ShapeDefinition,
  triangle: triangulo as ShapeDefinition,
  square: quadrado as ShapeDefinition,
  image: imagem as ShapeDefinition,
};

export function getShapeDefinition(kind: ShapeKind): ShapeDefinition {
  return DEFINITIONS[kind];
}

export function getAllShapeDefinitions(): ShapeDefinition[] {
  return Object.values(DEFINITIONS);
}

