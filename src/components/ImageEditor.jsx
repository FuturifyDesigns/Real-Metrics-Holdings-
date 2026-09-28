import { Minus, Plus, RotateCw, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPropertyCrop, drawPropertyCrop, loadImage } from '../lib/images';

export function ImageEditor({ source, onApply, onClose }) {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const objectUrl = source instanceof Blob ? URL.createObjectURL(source) : source;
    loadImage(objectUrl).then((next) => { if (active) setImage(next); }).catch((loadError) => setError(loadError.message));
    return () => {
      active = false;
      if (source instanceof Blob) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;
    drawPropertyCrop(canvas.getContext('2d', { alpha: false }), image, canvas.width, canvas.height, { zoom, offsetX, offsetY, rotation });
  }, [image, zoom, offsetX, offsetY, rotation]);

  const apply = async () => {
    if (!image) return;
    setSaving(true); setError('');
    try {
      const blob = await createPropertyCrop(image, { zoom, offsetX, offsetY, rotation });
      await onApply(blob);
    } catch (applyError) {
      setError(applyError.message || 'The edited image could not be saved.');
    } finally { setSaving(false); }
  };

  return <div className="image-editor-overlay" role="dialog" aria-modal="true" aria-label="Crop and edit property image">
    <section className="image-editor-panel">
      <header><div><span>Property photo</span><h2>Crop and position</h2></div><button type="button" onClick={onClose} aria-label="Close image editor"><X /></button></header>
      <canvas ref={canvasRef} width="800" height="500" aria-label="Image crop preview" />
      <div className="image-editor-controls">
        <label>Zoom<div><button type="button" onClick={() => setZoom((value) => Math.max(1, Number((value - .1).toFixed(1))))} aria-label="Zoom out"><Minus /></button><input type="range" min="1" max="3" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /><button type="button" onClick={() => setZoom((value) => Math.min(3, Number((value + .1).toFixed(1))))} aria-label="Zoom in"><Plus /></button></div></label>
        <label>Move left or right<input type="range" min="-100" max="100" value={offsetX} onChange={(event) => setOffsetX(Number(event.target.value))} /></label>
        <label>Move up or down<input type="range" min="-100" max="100" value={offsetY} onChange={(event) => setOffsetY(Number(event.target.value))} /></label>
      </div>
      <footer><button className="ghost-button" type="button" onClick={() => setRotation((value) => (value + 90) % 360)}><RotateCw size={17} />Rotate</button><button className="ghost-button" type="button" onClick={() => { setZoom(1); setOffsetX(0); setOffsetY(0); setRotation(0); }}>Reset</button><button className="primary-button" type="button" onClick={apply} disabled={!image || saving}>{saving ? 'Optimising…' : 'Apply crop'}</button></footer>
      {error && <p className="image-editor-error" role="alert">{error}</p>}
    </section>
  </div>;
}
