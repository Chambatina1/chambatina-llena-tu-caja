'use client';

import { useBoxFillerStore } from '@/store/box-filler-store';
import { motion, AnimatePresence } from 'framer-motion';

export default function Box3DView() {
  const { items, selectedBox, weightPercentage, volumePercentage, boxFull, boxFullReason } = useBoxFillerStore();

  const { width: bw, height: bh, depth: bd } = selectedBox;

  // Scale: map the largest box dimension to displaySize pixels
  const maxDim = Math.max(bw, bh, bd);
  const displaySize = 300;
  const scale = displaySize / maxDim;

  const dw = bw * scale;
  const dh = bh * scale;
  const dd = bd * scale;

  // Isometric projection (30-degree)
  const angle = Math.PI / 6;
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  const project = (x: number, y: number, z: number) => ({
    sx: (x - z) * cosA,
    sy: -(y) + (x + z) * sinA * 0.6,
  });

  // Box corners
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

  // Auto-center the viewBox
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

  // Sort items by z for painter's algorithm
  const sortedItems = [...items].sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // Color utilities
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
  function isLight(hex: string): boolean {
    const c = hex.replace('#', '');
    if (c.length === 3) {
      const [r, g, b] = c.split('').map((x) => parseInt(x + x, 16));
      return (r * 299 + g * 587 + b * 114) / 1000 > 128;
    }
    const num = parseInt(c, 16);
    const r = (num >> 16) & 0xff;
    const g = (num >> 8) & 0xff;
    const b = num & 0xff;
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  }
  function truncateText(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    const cut = text.substring(0, maxLen - 1);
    const lastSpace = cut.lastIndexOf(' ');
    return lastSpace > 0 ? cut.substring(0, lastSpace) : cut;
  }

  return (
    <div className="relative w-full flex flex-col items-center">
      {/* Weight bar */}
      <div className="w-full mb-1.5">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground">Peso</span>
          <span className="text-[10px] font-bold" style={{ color: getBarColor(wp) }}>
            {wp.toFixed(0)}% ({useBoxFillerStore.getState().currentWeight().toFixed(1)} / {selectedBox.maxWeight} lbs)
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: getBarColor(wp), width: `${Math.min(100, wp)}%` }} />
        </div>
      </div>

      {/* Volume bar */}
      <div className="w-full mb-1.5">
        <div className="flex justify-between items-center mb-0.5">
          <span className="text-[10px] font-medium text-muted-foreground">Volumen</span>
          <span className="text-[10px] font-bold" style={{ color: getBarColor(vp) }}>
            {vp.toFixed(0)}% ({useBoxFillerStore.getState().currentVolume().toFixed(0)} / {(bw * bh * bd).toFixed(0)} in³)
          </span>
        </div>
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: getBarColor(vp), width: `${Math.min(100, vp)}%` }} />
        </div>
      </div>

      {/* BOX FULL banner */}
      {isFull && (
        <div className="w-full mb-1.5 bg-red-500 text-white rounded-lg px-3 py-1.5 text-center text-[10px] font-bold">
          {reason === 'peso'
            ? 'CAJA LLENA — Peso máximo alcanzado'
            : 'CAJA LLENA — Volumen máximo alcanzado'}
        </div>
      )}

      {/* 3D Box SVG */}
      <svg
        viewBox={`${cx - displaySize * 0.8} ${cy - displaySize * 0.75} ${displaySize * 1.6} ${displaySize * 1.5}`}
        className="w-full max-w-sm"
        style={{ height: 'auto' }}
      >
        <defs>
          <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
            <path d="M 8 0 L 0 0 0 8" fill="none" stroke="#cbd5e1" strokeWidth="0.3" />
          </pattern>
          <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.06" />
          </filter>
        </defs>

        {/* Floor shadow */}
        <ellipse cx={cx} cy={corners[0].sy + 6} rx={(maxX - minX) / 2} ry={10} fill="#000" opacity="0.05" />

        {/* Box faces */}
        <g filter="url(#shadow)">
          <path d={poly([0, 1, 2, 3])} fill="#ffffff" fillOpacity="0.85" stroke="#94a3b8" strokeWidth="1" />
          <path d={poly([1, 5, 6, 2])} fill="#e2e8f0" fillOpacity="0.8" stroke="#94a3b8" strokeWidth="1" />
          <path d={poly([3, 2, 6, 7])} fill="#f1f5f9" fillOpacity="0.9" stroke="#94a3b8" strokeWidth="1" />
          <path d={poly([3, 2, 6, 7])} fill="url(#grid)" opacity="0.3" />
        </g>

        {/* Placed products */}
        {sortedItems.map((item) => {
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

          const topPoly = `${p[3].sx},${p[3].sy} ${p[2].sx},${p[2].sy} ${p[6].sx},${p[6].sy} ${p[7].sx},${p[7].sy}`;
          const frontPoly = `${p[0].sx},${p[0].sy} ${p[1].sx},${p[1].sy} ${p[2].sx},${p[2].sy} ${p[3].sx},${p[3].sy}`;
          const rightPoly = `${p[1].sx},${p[1].sy} ${p[5].sx},${p[5].sy} ${p[6].sx},${p[6].sy} ${p[2].sx},${p[2].sy}`;

          const baseColor = item.product.color;
          const topFill = lighten(baseColor, 32);
          const frontFill = baseColor;
          const sideFill = darken(baseColor, 22);
          const stroke = darken(baseColor, 25);

          // Center of the front face
          const fcx = (p[0].sx + p[1].sx + p[2].sx + p[3].sx) / 4;
          const fcy = (p[0].sy + p[1].sy + p[2].sy + p[3].sy) / 4;

          // Center of the top face
          const tcx = (p[3].sx + p[2].sx + p[6].sx + p[7].sx) / 4;
          const tcy = (p[3].sy + p[2].sy + p[6].sy + p[7].sy) / 4;

          const faceSize = Math.min(iw, ih, id_);
          const textColor = isLight(baseColor) ? '#1f2937' : '#ffffff';

          return (
            <g key={item.id}>
              {/* 3D product box */}
              <polygon points={topPoly} fill={topFill} stroke={stroke} strokeWidth="0.4" opacity="0.95" />
              <polygon points={frontPoly} fill={frontFill} stroke={stroke} strokeWidth="0.4" opacity="0.95" />
              <polygon points={rightPoly} fill={sideFill} stroke={stroke} strokeWidth="0.4" opacity="0.95" />

              {/* Packaging details */}
              {item.product.packagingType === 'can' && (
                <line x1={p[3].sx} y1={p[3].sy} x2={p[2].sx} y2={p[2].sy} stroke={darken(baseColor, 40)} strokeWidth="0.6" opacity="0.7" />
              )}
              {item.product.packagingType === 'jar' && ih > 15 && (
                <line x1={p[0].sx} y1={p[0].sy + (p[3].sy - p[0].sy) * 0.15} x2={p[1].sx} y2={p[1].sy + (p[2].sy - p[1].sy) * 0.15} stroke={darken(baseColor, 35)} strokeWidth="1.2" opacity="0.6" />
              )}
              {item.product.packagingType === 'pouch' && (
                <line x1={p[0].sx} y1={p[0].sy + (p[3].sy - p[0].sy) * 0.08} x2={p[1].sx} y2={p[1].sy + (p[2].sy - p[1].sy) * 0.08} stroke={darken(baseColor, 35)} strokeWidth="0.8" strokeDasharray="1,0.5" opacity="0.5" />
              )}

              {/* PRODUCT EMOJI on front face — always rendered via SVG text (mobile safe) */}
              {faceSize > 6 && (
                <text
                  x={fcx}
                  y={fcy + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(8, Math.min(faceSize * 0.4, 26))}
                  style={{ pointerEvents: 'none' }}
                >
                  {item.product.emoji}
                </text>
              )}

              {/* Product name on front face for large items */}
              {faceSize > 20 && (
                <text
                  x={fcx}
                  y={fcy + faceSize * 0.22}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(3.5, Math.min(faceSize * 0.11, 6.5))}
                  fontWeight="700"
                  fill={textColor}
                  style={{ pointerEvents: 'none', textShadow: isLight(baseColor) ? '0 0 3px rgba(255,255,255,0.9)' : '0 0 3px rgba(0,0,0,0.7)' }}
                >
                  {truncateText(item.product.nameEs, 22)}
                </text>
              )}

              {/* Price on front face for very large items */}
              {faceSize > 30 && (
                <text
                  x={fcx}
                  y={fcy + faceSize * 0.32}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={Math.max(3, Math.min(faceSize * 0.08, 5))}
                  fill={isLight(baseColor) ? '#6b7280' : 'rgba(255,255,255,0.8)'}
                  style={{ pointerEvents: 'none' }}
                >
                  ${item.product.price.toFixed(2)}
                </text>
              )}
            </g>
          );
        })}

        {/* Dimension labels */}
        <text x={(corners[0].sx + corners[1].sx) / 2} y={corners[0].sy + 12} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">
          {bw}&quot;
        </text>
        <text x={corners[3].sx - 10} y={(corners[3].sy + corners[0].sy) / 2} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600"
          transform={`rotate(-90, ${corners[3].sx - 10}, ${(corners[3].sy + corners[0].sy) / 2})`}>
          {bh}&quot;
        </text>
        <text x={(corners[4].sx + corners[7].sx) / 2 - 6} y={(corners[4].sy + corners[0].sy) / 2 + 3} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600"
          transform={`rotate(90, ${(corners[4].sx + corners[7].sx) / 2 - 6}, ${(corners[4].sy + corners[0].sy) / 2 + 3})`}>
          {bd}&quot;
        </text>
      </svg>

      {/* Empty state */}
      {items.length === 0 && !isFull && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-14">
          <div className="text-center bg-background/80 backdrop-blur-sm rounded-lg px-4 py-2">
            <p className="text-[10px] text-muted-foreground">
              Selecciona productos para llenar tu caja
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
