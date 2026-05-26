'use client';

import { useBoxFillerStore } from '@/store/box-filler-store';
import { motion, AnimatePresence } from 'framer-motion';

export default function Box3DView() {
  const { items, selectedBox, weightPercentage, volumePercentage, boxFull, boxFullReason } = useBoxFillerStore();

  const { width: bw, height: bh, depth: bd } = selectedBox;

  const maxDim = Math.max(bw, bh, bd);
  const displaySize = 280;
  const scale = displaySize / maxDim;

  const dw = bw * scale;
  const dh = bh * scale;
  const dd = bd * scale;

  // Isometric projection
  const angle = Math.PI / 6;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const project = (x: number, y: number, z: number) => ({
    sx: (x - z) * cosA,
    sy: -(y) + (x + z) * sinA * 0.6,
  });

  const corners = [
    project(0, 0, 0),
    project(dw, 0, 0),
    project(dw, dh, 0),
    project(0, dh, 0),
    project(0, 0, dd),
    project(dw, 0, dd),
    project(dw, dh, dd),
    project(0, dh, dd),
  ];

  const poly = (indices: number[]) =>
    indices.map((i, k) => `${k === 0 ? 'M' : 'L'} ${corners[i].sx} ${corners[i].sy}`).join(' ') + ' Z';

  const wp = weightPercentage();
  const vp = volumePercentage();
  const isFull = boxFull();
  const reason = boxFullReason();

  const allSx = corners.map((c) => c.sx);
  const allSy = corners.map((c) => c.sy);
  const minX = Math.min(...allSx);
  const maxX = Math.max(...allSx);
  const minY = Math.min(...allSy);
  const maxY = Math.max(...allSy);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  const getBarColor = (pct: number) =>
    pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : pct > 40 ? '#3b82f6' : '#22c55e';

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Weight bar */}
      <div className="w-full mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-muted-foreground">Peso</span>
          <span className="text-xs font-bold" style={{ color: getBarColor(wp) }}>
            {wp.toFixed(0)}% ({useBoxFillerStore.getState().currentWeight().toFixed(1)} / {selectedBox.maxWeight} lbs)
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getBarColor(wp) }}
            animate={{ width: `${wp}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* Volume bar */}
      <div className="w-full mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs font-medium text-muted-foreground">Volumen</span>
          <span className="text-xs font-bold" style={{ color: getBarColor(vp) }}>
            {vp.toFixed(0)}% ({useBoxFillerStore.getState().currentVolume().toFixed(0)} / {(bw * bh * bd).toFixed(0)} in³)
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getBarColor(vp) }}
            animate={{ width: `${vp}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      </div>

      {/* BOX FULL banner */}
      <AnimatePresence>
        {isFull && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full mb-2 bg-red-500 text-white rounded-lg px-3 py-2 text-center text-xs font-bold"
          >
            {reason === 'peso'
              ? 'CAJA LLENA por peso máximo'
              : 'CAJA LLENA por volumen máximo'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3D Box SVG */}
      <svg
        viewBox={`${cx - displaySize * 0.75} ${cy - displaySize * 0.7} ${displaySize * 1.5} ${displaySize * 1.4}`}
        className="w-full max-w-sm"
        style={{ height: 'auto' }}
      >
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#cbd5e1" strokeWidth="0.3" />
          </pattern>
          <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse
          cx={cx}
          cy={corners[0].sy + 8}
          rx={(maxX - minX) / 2}
          ry={12}
          fill="#000"
          opacity="0.06"
        />

        {/* Box faces */}
        <g filter="url(#shadow)">
          <path d={poly([0, 1, 2, 3])} fill="#ffffff" fillOpacity="0.7" stroke="#94a3b8" strokeWidth="1.2" />
          <path d={poly([1, 5, 6, 2])} fill="#e2e8f0" fillOpacity="0.8" stroke="#94a3b8" strokeWidth="1.2" />
          <path d={poly([3, 2, 6, 7])} fill="#f1f5f9" fillOpacity="0.9" stroke="#94a3b8" strokeWidth="1.2" />
          <path d={poly([3, 2, 6, 7])} fill="url(#grid)" opacity="0.4" />
        </g>

        {/* Placed products */}
        <AnimatePresence>
          {items.map((item) => {
            const ix = item.x * scale;
            const iy = item.y * scale;
            const iz = item.z * scale;
            const iw = item.w * scale;
            const ih = item.h * scale;
            const id_ = item.d * scale;

            const p = [
              project(ix, iy, iz),
              project(ix + iw, iy, iz),
              project(ix + iw, iy + ih, iz),
              project(ix, iy + ih, iz),
              project(ix, iy, iz + id_),
              project(ix + iw, iy, iz + id_),
              project(ix + iw, iy + ih, iz + id_),
              project(ix, iy + ih, iz + id_),
            ];

            const makePoly = (idx: number[]) =>
              idx.map((i, k) => `${k === 0 ? '' : ' '}${p[i].sx},${p[i].sy}`).join('');

            const baseColor = item.product.color;
            const darkColor = darken(baseColor, 40);
            const lightColor = lighten(baseColor, 30);

            return (
              <motion.g
                key={item.id}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.3, y: -15 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                style={{
                  transformOrigin: `${(p[0].sx + p[6].sx) / 2}px ${(p[0].sy + p[6].sy) / 2}px`,
                }}
              >
                <polygon points={makePoly([3, 2, 6, 7])} fill={lightColor} stroke={darkColor} strokeWidth="0.4" opacity="0.95" />
                <polygon points={makePoly([0, 1, 2, 3])} fill={baseColor} stroke={darkColor} strokeWidth="0.4" opacity="0.95" />
                <polygon points={makePoly([1, 5, 6, 2])} fill={darken(baseColor, 20)} stroke={darkColor} strokeWidth="0.4" opacity="0.95" />
                <text
                  x={(p[3].sx + p[6].sx) / 2}
                  y={(p[3].sy + p[6].sy) / 2 + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(6, Math.min(iw, ih, id_) * 0.3)}
                  className="pointer-events-none select-none"
                >
                  {item.product.emoji}
                </text>
              </motion.g>
            );
          })}
        </AnimatePresence>

        {/* Dimension labels */}
        <text x={(corners[0].sx + corners[1].sx) / 2} y={corners[0].sy + 14} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600">
          {bw}&quot;
        </text>
        <text x={corners[3].sx - 12} y={(corners[3].sy + corners[0].sy) / 2} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600"
          transform={`rotate(-90, ${corners[3].sx - 12}, ${(corners[3].sy + corners[0].sy) / 2})`}>
          {bh}&quot;
        </text>
        <text x={(corners[4].sx + corners[7].sx) / 2 - 8} y={(corners[4].sy + corners[0].sy) / 2 + 4} textAnchor="middle" fill="#64748b" fontSize="9" fontWeight="600"
          transform={`rotate(90, ${(corners[4].sx + corners[7].sx) / 2 - 8}, ${(corners[4].sy + corners[0].sy) / 2 + 4})`}>
          {bd}&quot;
        </text>
      </svg>

      {/* Empty state */}
      {items.length === 0 && !isFull && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-16">
          <div className="text-center bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-xs text-muted-foreground">
              Selecciona productos para llenar tu caja
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function darken(hex: string, amount: number): string {
  return shiftColor(hex, -amount);
}
function lighten(hex: string, amount: number): string {
  return shiftColor(hex, amount);
}
function shiftColor(hex: string, amount: number): string {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const num = parseInt(hex, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
