export async function loadMediaFile(file: File): Promise<HTMLMediaElement> {
  const url = URL.createObjectURL(file);
  const isVideo = file.type.startsWith('video/');
  const media: HTMLMediaElement = isVideo ? document.createElement('video') : new Audio();
  media.src = url;
  media.crossOrigin = 'anonymous';
  if (isVideo) {
    (media as HTMLVideoElement).playsInline = true;
  }

  await new Promise<void>((resolve, reject) => {
    media.addEventListener('loadedmetadata', () => resolve(), { once: true });
    media.addEventListener('error', () => reject(new Error('Failed to load media')), { once: true });
    media.load();
  });

  return media;
}
