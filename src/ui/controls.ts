import { presetKey } from '../core/config-store';
import { makeTwoColorGradient } from '../core/color-gradient';
import { getAllShapeDefinitions } from '../core/shape-registry';
import type { BarDirection, BarNormalMode, ShapeKind, VisualConfig } from '../core/types';

export interface ControlCallbacks {
  onConfigChange: (patch: Partial<VisualConfig>) => void;
  onShapeChange: (shape: ShapeKind) => void;
  onMediaFile: (file: File) => void;
  onImageFile: (file: File) => void;
  onSavePreset: () => void;
}

function updateModeSections(container: HTMLElement, mode: VisualConfig['renderMode']): void {
  container.querySelectorAll('[data-mode-section]').forEach((el) => {
    const section = (el as HTMLElement).dataset.modeSection;
    const show = section === 'shared' || section === mode;
    (el as HTMLElement).style.display = show ? '' : 'none';
  });
}

function updateBarNormalBlendVisibility(container: HTMLElement, mode: BarNormalMode): void {
  const blendField = container.querySelector('#bar-normal-blend-field') as HTMLElement | null;
  if (blendField) blendField.style.display = mode === 'hybrid' ? '' : 'none';
}

function updateShapeSections(container: HTMLElement, shape: ShapeKind): void {
  container.querySelectorAll('[data-shape-section]').forEach((el) => {
    const section = (el as HTMLElement).dataset.shapeSection;
    const show = section === 'all' || section === shape;
    (el as HTMLElement).style.display = show ? '' : 'none';
  });
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
  setRange('min-height', 'min-height-val', config.minHeight);
  setRange('bar-width', 'bar-width-val', config.barWidth);
  setRange('bar-width-wave', 'bar-width-wave-val', config.barWidth);
  setRange('wave-smoothing', 'wave-smoothing-val', config.waveSmoothing);
  setRange('mask-threshold', 'mask-threshold-val', config.maskThreshold);
  setRange('mask-blur', 'mask-blur-val', config.maskBlur);
  setRange('bar-normal-blend', 'bar-normal-blend-val', config.barNormalBlend);
  setRange('bar-normal-smooth', 'bar-normal-smooth-val', config.barNormalSmooth);

  const shapeSelect = container.querySelector('#shape') as HTMLSelectElement | null;
  if (shapeSelect) shapeSelect.value = shape;

  const modeSelect = container.querySelector('#render-mode') as HTMLSelectElement | null;
  if (modeSelect) modeSelect.value = config.renderMode;

  const dirSelect = container.querySelector('#bar-direction') as HTMLSelectElement | null;
  if (dirSelect) dirSelect.value = config.barDirection;

  const symCheck = container.querySelector('#wave-symmetry') as HTMLInputElement | null;
  if (symCheck) symCheck.checked = config.waveSymmetry;

  const snapCheck = container.querySelector('#snap-mode') as HTMLInputElement | null;
  if (snapCheck) snapCheck.checked = config.snapMode;

  const invertCheck = container.querySelector('#mask-invert') as HTMLInputElement | null;
  if (invertCheck) invertCheck.checked = config.maskInvert;

  const normalModeSelect = container.querySelector('#bar-normal-mode') as HTMLSelectElement | null;
  if (normalModeSelect) normalModeSelect.value = config.barNormalMode;

  updateBarNormalBlendVisibility(container, config.barNormalMode);

  const start = container.querySelector('#gradient-start') as HTMLInputElement | null;
  const end = container.querySelector('#gradient-end') as HTMLInputElement | null;
  if (start) start.value = config.gradientColorStart;
  if (end) end.value = config.gradientColorEnd;

  updateModeSections(container, config.renderMode);
  updateShapeSections(container, shape);
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
    <label class="control-field" data-mode-section="shared">
      Forma
      <select id="shape" class="control-select">${shapeOptions}</select>
    </label>
    <label class="control-field" data-mode-section="shared">
      Modo
      <select id="render-mode" class="control-select">
        <option value="bars" ${config.renderMode === 'bars' ? 'selected' : ''}>Barras</option>
        <option value="wave" ${config.renderMode === 'wave' ? 'selected' : ''}>Wave</option>
      </select>
    </label>
    <div class="control-field" data-mode-section="shared">
      <button type="button" id="save-preset" class="save-preset-btn">Salvar config</button>
    </div>
    <label class="control-field" data-mode-section="shared">
      Cor inicial
      <input type="color" id="gradient-start" class="control-color" value="${config.gradientColorStart}" />
    </label>
    <label class="control-field" data-mode-section="shared">
      Cor final
      <input type="color" id="gradient-end" class="control-color" value="${config.gradientColorEnd}" />
    </label>
    <label class="control-field" data-mode-section="shared">
      Direção
      <select id="bar-direction" class="control-select">
        <option value="inward" ${config.barDirection === 'inward' ? 'selected' : ''}>Para dentro</option>
        <option value="outward" ${config.barDirection === 'outward' ? 'selected' : ''}>Para fora</option>
      </select>
    </label>
    <label class="control-field" data-mode-section="shared">
      Direção das barras
      <select id="bar-normal-mode" class="control-select">
        <option value="local" ${config.barNormalMode === 'local' ? 'selected' : ''}>Local (contorno)</option>
        <option value="hybrid" ${config.barNormalMode === 'hybrid' ? 'selected' : ''}>Híbrido</option>
        <option value="radial" ${config.barNormalMode === 'radial' ? 'selected' : ''}>Radial</option>
      </select>
    </label>
    <label class="control-field" data-mode-section="shared" id="bar-normal-blend-field">
      Mistura radial
      <input type="range" id="bar-normal-blend" class="control-range" min="0" max="1" step="0.05" value="${config.barNormalBlend}" />
      <span class="control-value" id="bar-normal-blend-val">${config.barNormalBlend}</span>
    </label>
    <label class="control-field" data-mode-section="shared">
      Suavização de direção
      <input type="range" id="bar-normal-smooth" class="control-range" min="0" max="1" step="0.05" value="${config.barNormalSmooth}" />
      <span class="control-value" id="bar-normal-smooth-val">${config.barNormalSmooth}</span>
    </label>
    <label class="control-field" data-mode-section="shared">
      Pontos
      <input type="range" id="point-count" class="control-range" min="16" max="512" step="8" value="${config.pointCount}" />
      <span class="control-value" id="point-count-val">${config.pointCount}</span>
    </label>
    <label class="control-field" data-mode-section="shared">
      Altura dos picos
      <input type="range" id="peak-height" class="control-range" min="0.1" max="3" step="0.1" value="${config.peakHeight}" />
      <span class="control-value" id="peak-height-val">${config.peakHeight}</span>
    </label>
    <label class="control-field" data-mode-section="shared">
      Intensidade
      <input type="range" id="intensity" class="control-range" min="0.05" max="3" step="0.05" value="${config.intensity}" />
      <span class="control-value" id="intensity-val">${config.intensity}</span>
    </label>
    <label class="control-field" data-mode-section="shared">
      Altura mínima
      <input type="range" id="min-height" class="control-range" min="0" max="0.3" step="0.01" value="${config.minHeight}" />
      <span class="control-value" id="min-height-val">${config.minHeight}</span>
    </label>
    <label class="control-field control-check" data-mode-section="shared">
      Modo snap
      <input type="checkbox" id="snap-mode" class="control-checkbox" ${config.snapMode ? 'checked' : ''} />
    </label>
    <div class="control-field" data-shape-section="image">
      <span>Imagem da silhueta</span>
      <div class="file-picker" id="image-picker" role="button" tabindex="0">
        <span class="file-picker-btn">Escolher</span>
        <span class="file-picker-name" id="image-name">Nenhuma imagem</span>
      </div>
      <input type="file" accept="image/*" id="image-file" class="file-input-hidden" />
    </div>
    <label class="control-field" data-shape-section="image">
      Limiar
      <input type="range" id="mask-threshold" class="control-range" min="0" max="255" step="1" value="${config.maskThreshold}" />
      <span class="control-value" id="mask-threshold-val">${config.maskThreshold}</span>
    </label>
    <label class="control-field" data-shape-section="image">
      Desfoque
      <input type="range" id="mask-blur" class="control-range" min="0" max="8" step="1" value="${config.maskBlur}" />
      <span class="control-value" id="mask-blur-val">${config.maskBlur}</span>
    </label>
    <label class="control-field control-check" data-shape-section="image">
      Inverter máscara
      <input type="checkbox" id="mask-invert" class="control-checkbox" ${config.maskInvert ? 'checked' : ''} />
    </label>
    <label class="control-field" data-mode-section="bars">
      Grossura das barras
      <input type="range" id="bar-width" class="control-range" min="1" max="20" step="1" value="${config.barWidth}" />
      <span class="control-value" id="bar-width-val">${config.barWidth}</span>
    </label>
    <label class="control-field" data-mode-section="wave">
      Espessura da wave
      <input type="range" id="bar-width-wave" class="control-range" min="1" max="20" step="1" value="${config.barWidth}" />
      <span class="control-value" id="bar-width-wave-val">${config.barWidth}</span>
    </label>
    <label class="control-field" data-mode-section="wave">
      Suavização
      <input type="range" id="wave-smoothing" class="control-range" min="0" max="1" step="0.05" value="${config.waveSmoothing}" />
      <span class="control-value" id="wave-smoothing-val">${config.waveSmoothing}</span>
    </label>
    <label class="control-field control-check" data-mode-section="wave">
      Simetria
      <input type="checkbox" id="wave-symmetry" class="control-checkbox" ${config.waveSymmetry ? 'checked' : ''} />
    </label>
  `;

  updateModeSections(container, config.renderMode);
  updateShapeSections(container, shape);

  const fileInput = container.querySelector('#media-file') as HTMLInputElement;
  const filePicker = container.querySelector('#file-picker')!;
  const mediaName = container.querySelector('#media-name')!;
  const saveBtn = container.querySelector('#save-preset') as HTMLButtonElement;

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
    const nextShape = (e.target as HTMLSelectElement).value as ShapeKind;
    updateShapeSections(container, nextShape);
    cb.onShapeChange(nextShape);
  });

  const imageInput = container.querySelector('#image-file') as HTMLInputElement;
  const imagePicker = container.querySelector('#image-picker')!;
  const imageName = container.querySelector('#image-name')!;

  const openImage = () => imageInput.click();
  imagePicker.addEventListener('click', openImage);
  imagePicker.addEventListener('keydown', (e) => {
    const key = (e as KeyboardEvent).key;
    if (key === 'Enter' || key === ' ') {
      e.preventDefault();
      openImage();
    }
  });

  imageInput.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      imageName.textContent = file.name;
      cb.onImageFile(file);
    }
  });

  container.querySelector('#render-mode')!.addEventListener('change', (e) => {
    const mode = (e.target as HTMLSelectElement).value as VisualConfig['renderMode'];
    cb.onConfigChange({ renderMode: mode });
    updateModeSections(container, mode);
  });

  saveBtn.addEventListener('click', () => {
    const shapeVal = (container.querySelector('#shape') as HTMLSelectElement).value as ShapeKind;
    const modeVal = (container.querySelector('#render-mode') as HTMLSelectElement).value as VisualConfig['renderMode'];
    cb.onSavePreset();
    const label = presetKey(shapeVal, modeVal);
    const original = saveBtn.textContent;
    saveBtn.textContent = `Salvo (${label})`;
    saveBtn.disabled = true;
    setTimeout(() => {
      saveBtn.textContent = original;
      saveBtn.disabled = false;
    }, 2000);
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

  container.querySelector('#bar-normal-mode')!.addEventListener('change', (e) => {
    const mode = (e.target as HTMLSelectElement).value as BarNormalMode;
    updateBarNormalBlendVisibility(container, mode);
    cb.onConfigChange({ barNormalMode: mode });
  });

  container.querySelector('#wave-symmetry')!.addEventListener('change', (e) => {
    cb.onConfigChange({ waveSymmetry: (e.target as HTMLInputElement).checked });
  });

  container.querySelector('#snap-mode')!.addEventListener('change', (e) => {
    cb.onConfigChange({ snapMode: (e.target as HTMLInputElement).checked });
  });

  container.querySelector('#mask-invert')!.addEventListener('change', (e) => {
    cb.onConfigChange({ maskInvert: (e.target as HTMLInputElement).checked });
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
  bindRange('min-height', 'min-height-val', 'minHeight');
  bindRange('bar-width', 'bar-width-val', 'barWidth');
  bindRange('bar-width-wave', 'bar-width-wave-val', 'barWidth');
  bindRange('wave-smoothing', 'wave-smoothing-val', 'waveSmoothing');
  bindRange('mask-threshold', 'mask-threshold-val', 'maskThreshold');
  bindRange('mask-blur', 'mask-blur-val', 'maskBlur');
  bindRange('bar-normal-blend', 'bar-normal-blend-val', 'barNormalBlend');
  bindRange('bar-normal-smooth', 'bar-normal-smooth-val', 'barNormalSmooth');
}
