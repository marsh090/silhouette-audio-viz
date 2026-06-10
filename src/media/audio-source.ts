export async function loadAudioFile(file: File): Promise<HTMLAudioElement> {
  const url = URL.createObjectURL(file);
  const audio = new Audio(url);
  audio.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    audio.addEventListener('canplaythrough', () => resolve(), { once: true });
    audio.addEventListener('error', () => reject(new Error('Failed to load audio')), { once: true });
    audio.load();
  });
  return audio;
}
