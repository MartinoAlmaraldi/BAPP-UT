'use client';

import { useRef } from 'react';
import '@/styles/components/signature/signature-pad.css';

interface SignaturePadProps {
  /** Dipanggil setiap selesai satu goresan (berisi gambar PNG) dan saat dihapus (null). */
  onChange: (dataUrl: string | null) => void;
  disabled?: boolean;
  /** 'block': tombol Ulangi selebar kotak. 'link': tautan kecil di bawah kotak. */
  clearStyle?: 'block' | 'link';
}

// Resolusi internal kanvas. Tampilan menyesuaikan lebar layar lewat CSS.
const CANVAS_WIDTH = 720;
const CANVAS_HEIGHT = 400;

export default function SignaturePad({ onChange, disabled, clearStyle = 'block' }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const hasDrawn = useRef(false);

  function getPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = e.currentTarget;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  function applyStroke(ctx: CanvasRenderingContext2D) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (disabled) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;

    e.currentTarget.setPointerCapture(e.pointerId);
    isDrawing.current = true;

    const pos = getPos(e);
    applyStroke(ctx);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
    // Titik kecil supaya sekali ketuk pun terlihat
    ctx.lineTo(pos.x + 0.1, pos.y + 0.1);
    ctx.stroke();
    hasDrawn.current = true;
  }

  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawing.current || disabled) return;
    const ctx = e.currentTarget.getContext('2d');
    if (!ctx) return;

    const pos = getPos(e);
    applyStroke(ctx);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function finishDraw() {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas && hasDrawn.current) onChange(canvas.toDataURL('image/png'));
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    onChange(null);
  }

  return (
    <div className="sigpad">
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className={disabled ? 'sigpad__canvas sigpad__canvas--disabled' : 'sigpad__canvas'}
        onPointerDown={startDraw}
        onPointerMove={draw}
        onPointerUp={finishDraw}
        onPointerCancel={finishDraw}
      />

      <button
        type="button"
        onClick={clear}
        disabled={disabled}
        className={clearStyle === 'link' ? 'sigpad__clear sigpad__clear--link' : 'sigpad__clear'}
      >
        {clearStyle === 'block' && <RepeatIcon />}
        Ulangi
      </button>
    </div>
  );
}

function RepeatIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </svg>
  );
}