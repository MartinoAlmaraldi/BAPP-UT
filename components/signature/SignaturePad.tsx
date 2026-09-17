'use client';

import { useRef, useState } from 'react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}

const CANVAS_WIDTH = 350;
const CANVAS_HEIGHT = 180;

export default function SignaturePad({ onSave, disabled }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  function getCanvas(): HTMLCanvasElement {
    return canvasRef.current as HTMLCanvasElement;
  }

  function getContext(): CanvasRenderingContext2D {
    return getCanvas().getContext('2d') as CanvasRenderingContext2D;
  }

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = getCanvas();
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;
    const pos = getPos(e);
    const ctx = getContext();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || disabled) return;
    const pos = getPos(e);
    const ctx = getContext();
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    setHasDrawn(true);
  }

  function stopDraw() {
    isDrawing.current = false;
  }

  function clear() {
    const canvas = getCanvas();
    const ctx = getContext();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  }

  function handleSave() {
    if (!hasDrawn) return;
    const dataUrl = getCanvas().toDataURL('image/png');
    onSave(dataUrl);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          touchAction: 'none',
          width: CANVAS_WIDTH + 'px',
          height: CANVAS_HEIGHT + 'px',
          maxWidth: '100%',
        }}
        className="rounded-lg border border-dashed bg-gray-50"
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={stopDraw}
        onPointerLeave={stopDraw}
      />

      <div className="flex w-full gap-3">
        <button
          type="button"
          onClick={clear}
          className="h-10 flex-1 rounded-lg border text-sm font-medium"
        >
          Ulangi
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasDrawn || disabled}
          className="h-11 flex-1 rounded-lg bg-black text-sm font-medium text-white disabled:opacity-50"
        >
          Simpan tanda tangan
        </button>
      </div>
    </div>
  );
}
