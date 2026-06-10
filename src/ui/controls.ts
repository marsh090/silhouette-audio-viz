import { makeTwoColorGradient } from '../core/color-gradient';
import { getAllShapeDefinitions } from '../core/shape-registry';
import type { BarDirection, ShapeKind, VisualConfig } from '../core/types';

export interface ControlCallbacks {
  onConfigChange: (patch: Partial<VisualConfig>) => void;
  onShapeChange: (shape: ShapeKind) => void;
  onMediaFile: (file: File) => void;
}

export function syncControls(container: HTMLElement, config: VisualConfig, shape: ShapeKind): void {
  const setRange = (id: string, valId: string, value: number) => {
    const input = container.querySelector(`#${id}`) as HTMLInputElement | null;
    const val = container.querySelector(`#${valId}`);
    if (input) input.value = String(value);
    if (val) val.textContent = String(value);
  };

  setRange('point-count', 'point-count-val', config.pointCount);
  setRange('peak-height', 'peak-height-val', config.peakHeight);
  setRange('intensity', 'intensity-val', config.intensity);
  setRange('bar-width', 'bar-width-val', config.barWidth);

  const shapeSelect = container.querySelector('#shape') as HTMLSelectElement | null;
  if (shapeSelect) shapeSelect.value = shape;

  const dirSelect = container.querySelector('#bar-direction') as HTMLSelectElement | null;
  if (dirSelect) dirSelect.value = config.barDirection;

  const start = container.querySelector('#gradient-start') as HTMLInputElement | null;
  const end = container.querySelector('#gradient-end') as HTMLInputElement | null;
  if (start) start.value = config.gradientColorStart;
  if (end) end.value = config.gradientColorEnd;
}

export function mountControls(container: HTMLElement, config: VisualConfig, shape: ShapeKind, cb: ControlCallbacks): void {
  const shapeOptions = getAllShapeDefinitions()
    .map((d) => `<option value="${d.id}" ${d.id === shape ? 'selected' : ''}>${d.label}</option>`)
    .join('');

  container.innerHTML = `
    <div class="control-field">
      <span>Mídia</span>
      <div class="file-picker" id="file-picker" role="button" tabindex="0">
        <span class="file-picker-btn">Escolher</span>
        <span class="file-picker-name" id="media-name">Nenhum arquivo</span>
      </div>
      <input type="file" accept="audio/*,video/*" id="media-file" class="file-input-hidden" />
    </div>
    <label class="control-field">
      Forma
      <select id="shape" class="control-select">${shapeOptions}</select>
    </label>
    <label class="control-field">
      Cor inicial
      <input type="color" id="gradient-start" class="control-color" value="${config.gradientColorStart}" />
    </label>
    <label class="control-field">
      Cor final
      <input type="color" id="gradient-end" class="control-color" value="${config.gradientColorEnd}" />
    </label>
    <label class="control-field">
      Direção das barras
      <select id="bar-direction" class="control-select">
        <option value="inward" ${config.barDirection === 'inward' ? 'selected' : ''}>Para dentro</option>
        <option value="outward" ${config.barDirection === 'outward' ? 'selected' : ''}>Para fora</option>
      </select>
    </label>
    <label class="control-field">
      Pontos
      <input type="range" id="point-count" class="control-range" min="16" max="512" step="8" value="${config.pointCount}" />
      <span class="control-value" id="point-count-val">${config.pointCount}</span>
    </label>
    <label class="control-field">
      Altura dos picos
      <input type="range" id="peak-height" class="control-range" min="0.1" max="3" step="0.1" value="${config.peakHeight}" />
      <span class="control-value" id="peak-height-val">${config.peakHeight}</span>
    </label>
    <label class="control-field">
      Intensidade
      <input type="range" id="intensity" class="control-range" min="0.05" max="1" step="0.05" value="${config.intensity}" />
      <span class="control-value" id="intensity-val">${config.intensity}</span>
    </label>
    <label class="control-field">
      Grossura das barras
      <input type="range" id="bar-width" class="control-range" min="1" max="20" step="1" value="${config.barWidth}" />
      <span class="control-value" id="bar-width-val">${config.barWidth}</span>
    </label>
  `;

  const fileInput = container.querySelector('#media-file') as HTMLInputElement;
  const filePicker = container.querySelector('#file-picker')!;
  const mediaName = container.querySelector('#media-name')!;

  const openFile = () => fileInput.click();
  filePicker.addEventListener('click', openFile);
  filePicker.addEventListener('keydown', (e) => {
    const key = (e as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      openFile();
    }
  });

  fileInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      mediaName.textContent = file.name;
      cb.onMediaFile(file);
    }
  });

  container.querySelector('#shape')!.addEventListener('change', (e) => {
    cb.onShapeChange((e.target as HTMLSelectElement).value as ShapeKind);
  });

  const applyGradient = () => {
    const start = (container.querySelector('#gradient-start') as HTMLInputElement).value;
    const end = (container.querySelector('#gradient-end') as HTMLInputElement).value;
    cb.onConfigChange({
      gradientColorStart: start,
      gradientColorEnd: end,
      colorGradient: makeTwoColorGradient(start, end),
    });
  };

  container.querySelector('#gradient-start')!.addEventListener('input', applyGradient);
  container.querySelector('#gradient-end')!.addEventListener('input', applyGradient);

  container.querySelector('#bar-direction')!.addEventListener('change', (e) => {
    cb.onConfigChange({ barDirection: (e.target as HTMLSelectElement).value as BarDirection });
  });

  const bindRange = (id: string, valId: string, key: keyof VisualConfig) => {
    const input = container.querySelector(`#${id}`) as HTMLInputElement;
    const val = container.querySelector(`#${valId}`)!;
    input.addEventListener('input', () => {
      val.textContent = input.value;
      cb.onConfigChange({ [key]: parseFloat(input.value) } as Partial<VisualConfig>);
    });
  };

  bindRange('point-count', 'point-count-val', 'pointCount');
  bindRange('peak-height', 'peak-height-val', 'peakHeight');
  bindRange('intensity', 'intensity-val', 'intensity');
  bindRange('bar-width', 'bar-width-val', 'barWidth');
}
