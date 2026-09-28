export const MAX_PROPERTY_IMAGES = 20;
export const MAX_SOURCE_IMAGE_BYTES = 8 * 1024 * 1024;
export const ACCEPTED_PROPERTY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const loadImage = (source) => new Promise((resolve, reject) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => resolve(image);
  image.onerror = () => reject(new Error('This image could not be opened.'));
  image.src = source;
});

const encodeCanvas = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('This image could not be processed.')), 'image/webp', quality);
});

const canvasBlob = async (canvas, initialQuality = 0.8) => {
  let quality = initialQuality;
  let workingCanvas = canvas;
  let blob = await encodeCanvas(workingCanvas, quality);
  while (blob.size > 650 * 1024 && quality > 0.56) {
    quality = Number((quality - 0.06).toFixed(2));
    blob = await encodeCanvas(workingCanvas, quality);
  }
  while (blob.size > 650 * 1024 && workingCanvas.width > 640) {
    const smaller = document.createElement('canvas');
    smaller.width = Math.max(640, Math.round(workingCanvas.width * 0.82));
    smaller.height = Math.max(1, Math.round(workingCanvas.height * 0.82));
    smaller.getContext('2d', { alpha: false }).drawImage(workingCanvas, 0, 0, smaller.width, smaller.height);
    workingCanvas = smaller;
    blob = await encodeCanvas(workingCanvas, 0.56);
  }
  return blob;
};

export async function compressPropertyImage(file) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
    const scale = Math.min(1, 1920 / largestSide);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext('2d', { alpha: false }).drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await canvasBlob(canvas);
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'property-image';
    return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() });
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

export function drawPropertyCrop(context, image, width, height, options) {
  const { zoom = 1, offsetX = 0, offsetY = 0, rotation = 0 } = options;
  const quarterTurn = Math.abs(rotation % 180) === 90;
  const rotatedWidth = quarterTurn ? image.naturalHeight : image.naturalWidth;
  const rotatedHeight = quarterTurn ? image.naturalWidth : image.naturalHeight;
  const scale = Math.max(width / rotatedWidth, height / rotatedHeight) * zoom;
  const overflowX = Math.max(0, (rotatedWidth * scale - width) / 2);
  const overflowY = Math.max(0, (rotatedHeight * scale - height) / 2);

  context.save();
  context.clearRect(0, 0, width, height);
  context.fillStyle = '#171719';
  context.fillRect(0, 0, width, height);
  context.translate(width / 2 + (offsetX / 100) * overflowX, height / 2 + (offsetY / 100) * overflowY);
  context.rotate((rotation * Math.PI) / 180);
  context.drawImage(image, -image.naturalWidth * scale / 2, -image.naturalHeight * scale / 2, image.naturalWidth * scale, image.naturalHeight * scale);
  context.restore();
}

export async function createPropertyCrop(image, options) {
  const canvas = document.createElement('canvas');
  canvas.width = 1600;
  canvas.height = 1000;
  drawPropertyCrop(canvas.getContext('2d', { alpha: false }), image, canvas.width, canvas.height, options);
  return canvasBlob(canvas, 0.82);
}

export { loadImage };
