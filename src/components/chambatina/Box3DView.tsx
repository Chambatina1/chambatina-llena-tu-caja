'use client';

import { useBoxFillerStore } from '@/store/box-filler-store';
import { useMemo, useState, useCallback } from 'react';

// ─── Product image map by packaging type ───
const PRODUCT_IMAGES: Record<string, string> = {
  can: '/products/can.png',
  bottle: '/products/bottle.png',
  bag: '/products/bag.png',
  jar: '/products/jar.png',
  box: '/products/box.png',
  bar: '/products/bar.png',
  pouch: '/products/pouch.png',
};

export default function Box3DView() {
  const { items, selectedBox, weightPercentage, volumePercentage, boxFull, boxFullReason } = useBoxFillerStore();
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = useCallback((itemKey: string) => {
    setFailedImages((prev) => new Set(prev).add(itemKey));
  }, []);
  const { width: bw, height: bh, depth: bd } = selectedBox;

  const wp = weightPercentage();
  const vp = volumePercentage();
  const isFull = boxFull();
  const reason = boxFullReason();
  const weight = useBoxFillerStore.getState().currentWeight();
  const volume = useBoxFillerStore.getState().currentVolume();

  const getBarColor = (pct: number) =>
    pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : pct > 40 ? '#3b82f6' : '#22c55e';

  // CSS 3D box dimensions (in px)
  const boxW = bw * 16; // scale: 1 inch = 16px
  const boxH = bh * 16;
  const boxD = bd * 16;

  // Sort items by painter's algorithm (back to front)
  const sortedItems = useMemo(() =>
    [...items].sort((a, b) => {
      if (a.z !== b.z) return a.z - b.z;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    }), [items]
  );

  const itemScale = 16; // 1 inch = 16px

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Weight bar */}
      <div className="w-full mb-1.5">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground">Peso</span>
          <span className="text-[10px] font-bold" style={{ color: getBarColor(wp) }}>
            {wp.toFixed(0)}% ({weight.toFixed(1)} / {selectedBox.maxWeight} lbs)
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ backgroundColor: getBarColor(wp), width: `${Math.min(100, wp)}%` }} />
        </div>
      </div>

      {/* Volume bar */}
      <div className="w-full mb-1.5">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground">Volumen</span>
          <span className="text-[10px] font-bold" style={{ color: getBarColor(vp) }}>
            {vp.toFixed(0)}% ({volume.toFixed(0)} / {(bw * bh * bd).toFixed(0)} in³)
          </span>
        </div>
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300"
            style={{ backgroundColor: getBarColor(vp), width: `${Math.min(100, vp)}%` }} />
        </div>
      </div>

      {/* BOX FULL banner */}
      {isFull && (
        <div className="w-full mb-1.5 bg-red-500 text-white rounded-lg px-3 py-1.5 text-center text-[10px] font-bold">
          {reason === 'peso' ? 'CAJA LLENA — Peso máximo' : 'CAJA LLENA — Volumen máximo'}
        </div>
      )}

      {/* ─── 3D CSS Box with products ─── */}
      <div style={{
        perspective: '900px',
        perspectiveOrigin: '50% 40%',
        width: '100%',
        height: Math.max(boxH + 80, 280),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
      }}>
        <div style={{
          transformStyle: 'preserve-3d',
          transform: 'rotateX(-25deg) rotateY(-35deg) rotateZ(5deg)',
          width: boxW,
          height: boxH,
          position: 'relative',
        }}>
          {/* ─── The outer shipping box (wireframe) ─── */}
          <div style={{
            position: 'absolute',
            width: boxW,
            height: boxH,
            transformStyle: 'preserve-3d',
          }}>
            {/* Front face */}
            <div style={{
              position: 'absolute', width: boxW, height: boxH,
              background: 'rgba(255,255,255,0.08)',
              border: '1.5px solid rgba(148,163,184,0.6)',
              transform: `translateZ(${boxD}px)`,
              borderRadius: 2,
            }} />
            {/* Back face */}
            <div style={{
              position: 'absolute', width: boxW, height: boxH,
              background: 'rgba(255,255,255,0.03)',
              border: '1.5px solid rgba(148,163,184,0.3)',
              borderRadius: 2,
            }} />
            {/* Left face */}
            <div style={{
              position: 'absolute', width: boxD, height: boxH,
              background: 'rgba(226,232,240,0.1)',
              border: '1.5px solid rgba(148,163,184,0.5)',
              transform: `rotateY(-90deg) translateZ(0px)`,
              borderRadius: 2,
            }} />
            {/* Right face */}
            <div style={{
              position: 'absolute', width: boxD, height: boxH,
              background: 'rgba(226,232,240,0.15)',
              border: '1.5px solid rgba(148,163,184,0.5)',
              transform: `rotateY(90deg) translateZ(${boxW - boxD}px)`,
              borderRadius: 2,
            }} />
            {/* Top face */}
            <div style={{
              position: 'absolute', width: boxW, height: boxD,
              background: 'rgba(241,245,249,0.12)',
              border: '1.5px solid rgba(148,163,184,0.4)',
              transform: `rotateX(90deg) translateZ(0px)`,
              borderRadius: 2,
            }} />
            {/* Bottom face */}
            <div style={{
              position: 'absolute', width: boxW, height: boxD,
              background: 'rgba(241,245,249,0.06)',
              border: '1.5px solid rgba(148,163,184,0.3)',
              transform: `rotateX(-90deg) translateZ(${boxH - boxD}px)`,
              borderRadius: 2,
            }} />
          </div>

          {/* ─── Products inside the box ─── */}
          {sortedItems.map((item) => {
            const iw = item.w * itemScale;
            const ih = item.h * itemScale;
            const id_ = item.d * itemScale;
            const ix = item.x * itemScale;
            const iy = boxH - (item.y + item.h) * itemScale; // flip Y (CSS y goes down)
            const iz = item.z * itemScale;

            const fallbackSrc = PRODUCT_IMAGES[item.product.packagingType] || PRODUCT_IMAGES.box;
            const itemKey = item.id;
            const useRealImage = !failedImages.has(itemKey);
            const imgSrc = useRealImage
              ? (item.product.imageUrl || `/api/walmart-image?url=${encodeURIComponent(item.product.walmartUrl)}`)
              : fallbackSrc;
            const baseColor = item.product.color;
            const isCylinder = item.product.packagingType === 'can' || item.product.packagingType === 'jar' || item.product.packagingType === 'bottle';
            const faceSize = Math.min(item.w, item.h, item.d);

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  width: iw,
                  height: ih,
                  left: ix,
                  top: iy,
                  transform: `translateZ(${iz}px)`,
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Front face - main product image */}
                <div style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  borderRadius: isCylinder ? '8px' : '3px',
                  overflow: 'hidden',
                  boxShadow: '1px 2px 4px rgba(0,0,0,0.15)',
                  backfaceVisibility: 'hidden',
                }}>
                  {/* Product image */}
                  <img
                    src={imgSrc}
                    alt={item.product.nameEs}
                    loading="eager"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: useRealImage ? 'contain' : 'cover',
                      display: 'block',
                      borderRadius: isCylinder ? '8px' : '3px',
                    }}
                    draggable={false}
                    onError={() => handleImageError(itemKey)}
                  />

                  {/* Product name label */}
                  {faceSize >= 2 && (
                    <div style={{
                      position: 'absolute',
                      bottom: 2,
                      left: '5%',
                      right: '5%',
                      background: 'rgba(0,0,0,0.72)',
                      borderRadius: 3,
                      padding: '1px 4px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        color: '#fff',
                        fontSize: Math.max(7, Math.min(faceSize * 1.8, 11)),
                        fontWeight: 800,
                        lineHeight: 1.2,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}>
                        {item.product.nameEs}
                      </div>
                      <div style={{
                        color: '#4ade80',
                        fontSize: Math.max(6, Math.min(faceSize * 1.4, 9)),
                        fontWeight: 700,
                        lineHeight: 1.1,
                      }}>
                        {item.product.weight} lb · ${item.product.price.toFixed(2)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Top face (visible from above) */}
                <div style={{
                  position: 'absolute',
                  width: iw,
                  height: id_,
                  left: 0,
                  bottom: '100%',
                  background: baseColor,
                  opacity: 0.25,
                  transform: `rotateX(90deg)`,
                  transformOrigin: 'bottom',
                  borderRadius: isCylinder ? '8px' : '2px',
                  border: `0.5px solid rgba(100,116,139,0.3)`,
                }} />

                {/* Right face (visible from side) */}
                <div style={{
                  position: 'absolute',
                  width: id_,
                  height: '100%',
                  left: '100%',
                  top: 0,
                  background: baseColor,
                  opacity: 0.3,
                  transform: `rotateY(90deg)`,
                  transformOrigin: 'left',
                  borderRadius: isCylinder ? '8px' : '2px',
                  border: `0.5px solid rgba(100,116,139,0.3)`,
                }} />
              </div>
            );
          })}

          {/* Dimension labels */}
          <div style={{
            position: 'absolute',
            bottom: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: 11,
            color: '#64748b',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            transformStyle: 'flat',
          }}>
            {bw}" × {bh}" × {bd}"
          </div>
        </div>
      </div>

      {/* Empty state */}
      {items.length === 0 && !isFull && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 10,
        }}>
          <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
            <p className="text-xs text-gray-500">Selecciona productos para llenar tu caja</p>
          </div>
        </div>
      )}
    </div>
  );
}
