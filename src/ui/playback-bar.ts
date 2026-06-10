export interface PlaybackBarHandle {
  update(currentTime: number, duration: number): void;
  setEnabled(enabled: boolean): void;
  setPlaying(playing: boolean): void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function mountPlaybackBar(
  container: HTMLElement,
  onSeek: (time: number) => void,
  onTogglePlay: () => void,
): PlaybackBarHandle {
  container.innerHTML = `
    <div class="playback-bar">
      <button type="button" id="playback-toggle" class="playback-toggle" disabled aria-label="Play">▶</button>
      <span class="playback-time" id="playback-time">0:00 / 0:00</span>
      <input type="range" id="playback-seek" class="control-range" min="0" max="0" step="0.01" value="0" disabled />
    </div>
  `;

  const toggleBtn = container.querySelector('#playback-toggle') as HTMLButtonElement;
  const slider = container.querySelector('#playback-seek') as HTMLInputElement;
  const timeLabel = container.querySelector('#playback-time')!;
  let seeking = false;

  toggleBtn.addEventListener('click', () => onTogglePlay());

  slider.addEventListener('pointerdown', () => { seeking = true; });
  slider.addEventListener('input', () => {
    const t = parseFloat(slider.value);
    timeLabel.textContent = `${formatTime(t)} / ${formatTime(parseFloat(slider.max))}`;
    onSeek(t);
  });
  slider.addEventListener('pointerup', () => { seeking = false; });

  return {
    update(currentTime: number, duration: number) {
      const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
      if (safeDuration > 0) {
        slider.max = String(safeDuration);
        slider.disabled = false;
      }
      if (!seeking) {
        slider.value = String(Math.min(currentTime, safeDuration || currentTime));
        timeLabel.textContent = `${formatTime(currentTime)} / ${formatTime(safeDuration)}`;
      }
    },
    setEnabled(enabled: boolean) {
      toggleBtn.disabled = !enabled;
      if (!enabled) slider.disabled = true;
    },
    setPlaying(playing: boolean) {
      toggleBtn.textContent = playing ? '⏸' : '▶';
      toggleBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
    },
  };
}
