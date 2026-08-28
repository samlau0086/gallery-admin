import { zipSync } from 'fflate';

const extensionFrom = (response: Response, source: string) => {
  const type = response.headers.get('content-type')?.split(';')[0] || '';
  const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
  if (extensions[type]) return extensions[type];
  const match = new URL(source).pathname.match(/\.([a-z0-9]{2,5})$/i);
  return match?.[1]?.toLowerCase() || 'jpg';
};

const filenamePart = (value: string) => value.replace(/[^a-z0-9_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'product-images';

const initDownloadImageButtons = () => {
  document.querySelectorAll<HTMLButtonElement>('[data-download-images]').forEach((button) => {
    if (button.dataset.downloadImagesBound) return;
    button.dataset.downloadImagesBound = 'true';
    button.addEventListener('click', () => downloadImages(button));
  });
};

const downloadImages = async (button: HTMLButtonElement) => {
  const status = document.querySelector<HTMLElement>('[data-download-images-status]');
  const urls: string[] = JSON.parse(button.dataset.imageUrls || '[]');
  const slug = filenamePart(button.dataset.productSlug || 'product');
  if (!urls.length) return;

  button.disabled = true;
  const originalLabel = button.textContent;
  try {
    const files: Record<string, Uint8Array> = {};
    for (const [index, source] of urls.entries()) {
      button.textContent = `Preparing images (${index + 1}/${urls.length})…`;
      if (status) status.textContent = `Downloading image ${index + 1} of ${urls.length}…`;
      const imageUrl = new URL(source, window.location.href);
      const requestUrl = imageUrl.hostname === 'xcimg.szwego.com' ? `/api/export-image?url=${encodeURIComponent(imageUrl.href)}` : imageUrl.href;
      const response = await fetch(requestUrl);
      if (!response.ok) throw new Error(`Image ${index + 1} could not be downloaded.`);
      files[`${slug}-${String(index + 1).padStart(2, '0')}.${extensionFrom(response, imageUrl.href)}`] = new Uint8Array(await response.arrayBuffer());
    }
    const archive = new Blob([zipSync(files, { level: 6 })], { type: 'application/zip' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(archive);
    link.download = `${slug}-images.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
    if (status) status.textContent = `${urls.length} images downloaded.`;
  } catch (error) {
    if (status) status.textContent = error instanceof Error ? error.message : 'Unable to prepare the image download.';
  } finally {
    button.disabled = false;
    button.textContent = originalLabel;
  }
};

initDownloadImageButtons();
document.addEventListener('astro:page-load', initDownloadImageButtons);
