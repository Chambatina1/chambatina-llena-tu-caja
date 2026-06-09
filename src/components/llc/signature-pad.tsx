'use client';

import { useRef, useState, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';

interface SignaturePadProps {
  onSign: (data: string) => void;
  disabled?: boolean;
  width?: number;
  height?: number;
}

export interface SignaturePadHandle {
  clear: () => void;
}

const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad(
    { onSign, disabled = false, width = 600, height = 200 },
    ref
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);
    const lastPos = useRef<{ x: number; y: number } | null>(null);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, width, height);
        // Redraw the baseline
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.stroke();
        setHasSignature(false);
        onSign('');
      }
    }, [width, height, onSign]);

    useImperativeHandle(ref, () => ({ clear: clearCanvas }), [clearCanvas]);

    const getPos = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = width / rect.width;
        const scaleY = height / rect.height;
        if ('touches' in e) {
          const touch = e.touches[0];
          return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY,
          };
        }
        return {
          x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
          y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
        };
      },
      [width, height]
    );

    const startDrawing = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled) return;
        e.preventDefault();
        const pos = getPos(e);
        lastPos.current = pos;
        setIsDrawing(true);
        const ctx = canvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.beginPath();
          ctx.moveTo(pos.x, pos.y);
        }
      },
      [disabled, getPos]
    );

    const draw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled) return;
        e.preventDefault();
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;
        const pos = getPos(e);
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (lastPos.current) {
          ctx.beginPath();
          ctx.moveTo(lastPos.current.x, lastPos.current.y);
          ctx.lineTo(pos.x, pos.y);
          ctx.stroke();
        }
        lastPos.current = pos;
        setHasSignature(true);
      },
      [isDrawing, disabled, getPos]
    );

    const stopDrawing = useCallback(() => {
      if (isDrawing) {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && hasSignature) {
          onSign(canvas.toDataURL('image/png'));
        }
      }
    }, [isDrawing, hasSignature, onSign]);

    // Draw the signature line on initial render
    useEffect(() => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        ctx.clearRect(0, 0, width, height);
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(20, height - 30);
        ctx.lineTo(width - 20, height - 30);
        ctx.stroke();
      }
    }, [width, height]);

    return (
      <div className="w-full">
        <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white relative">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            className={`w-full cursor-crosshair touch-none ${
              disabled ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-gray-400 text-sm">
                Firme aquí con el mouse o el dedo
              </p>
            </div>
          )}
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={clearCanvas}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700 underline"
          >
            Borrar firma
          </button>
        )}
      </div>
    );
  }
);

export default SignaturePad;
