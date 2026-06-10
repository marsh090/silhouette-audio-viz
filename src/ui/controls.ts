import type { ShapeKind, VisualConfig } from '../core/types';

export interface ControlCallbacks {
  onConfigChange: (patch: Partial<VisualConfig>) => void;
  onShapeChange: (shape: ShapeKind) => void;
  onAudioFile: (file: File) => void;
  onPlay: () => void;
  onPause: () => void;
}

export function mountControls(container: HTMLElement, config: VisualConfig, cb: ControlCallbacks): void {
  container.innerHTML = `
    <label>Áudio <input type="file" accept="audio/*" id="audio-file" /></label>
    <label>Forma
      <select id="shape">
        <option value="line">Linha</option>
        <option value="circle" selected>Círculo</option>
      </select>
    </label>
    <label>Pontos
      <input type="range" id="point-count" min="16" max="512" step="8" value="${config.pointCount}" />
      <span id="point-count-val">${config.pointCount}</span>
    </label>
    <label>Altura dos picos
      <input type="range" id="peak-height" min="0.1" max="3" step="0.1" value="${config.peakHeight}" />
      <span id="peak-height-val">${config.peakHeight}</span>
    </label>
    <button type="button" id="play">Play</button>
    <button type="button" id="pause">Pause</button>
  `;

  container.querySelector('#audio-file')!.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) cb.onAudioFile(file);
  });

  container.querySelector('#shape')!.addEventListener('change', (e) => {
    cb.onShapeChange((e.target as HTMLSelectElement).value as ShapeKind);
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

  container.querySelector('#play')!.addEventListener('click', () => cb.onPlay());
  container.querySelector('#pause')!.addEventListener('click', () => cb.onPause());
}
