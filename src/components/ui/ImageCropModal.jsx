import { useEffect, useRef, useState } from 'react';
import { Check, X, RotateCw, ZoomIn } from 'lucide-react';

// A Luma-style "adjust before you save it" step: after picking a photo from
// the device gallery, this shows it in a fixed-aspect frame the person can
// pan (drag) and zoom (slider/wheel) before it becomes the actual cover
// image — instead of just slapping on whatever crop a blind center-crop
// happened to produce. Pure canvas, no external cropper library (none
// could be installed here without npm/network access anyway).
export default function ImageCropModal({ open, imageSrc, aspect = 16 / 9, onCancel, onConfirm }) {
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // pan, in canvas px
  const dragRef = useRef(null);

  const CANVAS_W = 480;
  const CANVAS_H = Math.round(CANVAS_W / aspect);

  useEffect(() => {
    if (!open || !imageSrc) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setZoom(1);
      setRotation(0);
      setOffset({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [open, imageSrc]);

  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, rotation, offset, open]);

  function baseScale(img) {
    // Cover-fit: the smaller scale that still fills the whole crop frame.
    return Math.max(CANVAS_W / img.width, CANVAS_H / img.height);
  }

  function draw() {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.save();
    ctx.translate(CANVAS_W / 2 + offset.x, CANVAS_H / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    const scale = baseScale(img) * zoom;
    ctx.drawImage(img, -(img.width * scale) / 2, -(img.height * scale) / 2, img.width * scale, img.height * scale);
    ctx.restore();
  }

  function handlePointerDown(e) {
    dragRef.current = { startX: e.clientX, startY: e.clientY, origin: offset };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function handlePointerMove(e) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.origin.x + dx, y: dragRef.current.origin.y + dy });
  }
  function handlePointerUp() {
    dragRef.current = null;
  }
  function handleWheel(e) {
    e.preventDefault();
    setZoom((z) => Math.min(3, Math.max(1, z - e.deltaY * 0.001)));
  }

  function handleConfirm() {
    // Re-render at 2x for a sharper saved image than the on-screen preview.
    const outW = CANVAS_W * 2;
    const outH = CANVAS_H * 2;
    const out = document.createElement('canvas');
    out.width = outW;
    out.height = outH;
    const ctx = out.getContext('2d');
    const img = imgRef.current;
    ctx.save();
    ctx.translate(outW / 2 + offset.x * 2, outH / 2 + offset.y * 2);
    ctx.rotate((rotation * Math.PI) / 180);
    const scale = baseScale(img) * 2 * zoom;
    ctx.drawImage(img, -(img.width * scale) / 2, -(img.height * scale) / 2, img.width * scale, img.height * scale);
    ctx.restore();
    onConfirm(out.toDataURL('image/jpeg', 0.85));
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.65)' }}>
      <div className="w-full max-w-sm rounded-2xl border overflow-hidden" style={{ background: 'var(--panel)', borderColor: 'var(--line-10)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--line-08)' }}>
          <h3 className="font-display font-semibold text-sm text-[var(--text)]">Adjust photo</h3>
          <button type="button" onClick={onCancel} className="text-[var(--text-dim)] hover:text-[var(--text)]" aria-label="Cancel">
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            className="w-full rounded-lg touch-none cursor-move select-none"
            style={{ background: '#0A0D18', aspectRatio: `${aspect}` }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          />
          <p className="text-[11px] text-[var(--text-dim)] mt-2 text-center">Drag to reposition &middot; scroll or use the slider to zoom</p>

          <div className="flex items-center gap-3 mt-4">
            <ZoomIn size={15} className="text-[var(--text-dim)] shrink-0" />
            <input
              type="range" min={1} max={3} step={0.01} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="w-8 h-8 shrink-0 rounded-lg border flex items-center justify-center hover:bg-white/5"
              style={{ borderColor: 'var(--line-12)' }}
              aria-label="Rotate 90 degrees"
            >
              <RotateCw size={14} className="text-[var(--text-dim)]" />
            </button>
          </div>
        </div>

        <div className="flex gap-3 px-5 pb-5">
          <button type="button" onClick={onCancel} className="flex-1 text-sm font-semibold py-2.5 rounded-lg border hover:bg-white/5 text-[var(--text)]" style={{ borderColor: 'var(--line-14)' }}>
            Cancel
          </button>
          <button type="button" onClick={handleConfirm} className="flex-1 flex items-center justify-center gap-1.5 text-sm font-semibold py-2.5 rounded-lg" style={{ background: '#22D3A6', color: '#04140f' }}>
            <Check size={15} /> Use photo
          </button>
        </div>
      </div>
    </div>
  );
}
