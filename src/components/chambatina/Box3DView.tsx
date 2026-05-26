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

  // Pre-calculate projected product positions and sizes for product labels
  const productLabels = sortedItems.map((item) => {
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

    // Center of the front face for label positioning
    const frontCx = (p[0].sx + p[1].sx + p[2].sx + p[3].sx) / 4;
    const frontCy = (p[0].sy + p[1].sy + p[2].sy + p[3].sy) / 4;

    // Size of the projected front face (approximate)
    const frontW = Math.abs(p[1].sx - p[0].sx);
    const frontH = Math.abs(p[3].sy - p[0].sy);

    const makePoly = (idx: number[]) =>
      idx.map((i) => `${p[i].sx},${p[i].sy}`).join(' ');

    return {
      item,
      p,
      frontCx,
      frontCy,
      frontW,
      frontH,
      topPoly: `${p[3].sx},${p[3].sy} ${p[2].sx},${p[2].sy} ${p[6].sx},${p[6].sy} ${p[7].sx},${p[7].sy}`,
      frontPoly: `${p[0].sx},${p[0].sy} ${p[1].sx},${p[1].sy} ${p[2].sx},${p[2].sy} ${p[3].sx},${p[3].sy}`,
      rightPoly: `${p[1].sx},${p[1].sy} ${p[5].sx},${p[5].sy} ${p[6].sx},${p[6].sy} ${p[2].sx},${p[2].sy}`,
      baseColor: item.product.color,
      iw,
      ih,
      id_,
    };
  });

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
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getBarColor(wp) }}
            animate={{ width: `${Math.min(100, wp)}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
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
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getBarColor(vp) }}
            animate={{ width: `${Math.min(100, vp)}%` }}
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
            className="w-full mb-1.5 bg-red-500 text-white rounded-lg px-3 py-1.5 text-center text-[10px] font-bold"
          >
            {reason === 'peso'
              ? 'CAJA LLENA — Peso máximo alcanzado'
              : 'CAJA LLENA — Volumen máximo alcanzado'}
          </motion.div>
        )}
      </AnimatePresence>

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
        <ellipse
          cx={cx}
          cy={corners[0].sy + 6}
          rx={(maxX - minX) / 2}
          ry={10}
          fill="#000"
          opacity="0.05"
        />

        {/* Box faces */}
        <g filter="url(#shadow)">
          {/* Front face */}
          <path d={poly([0, 1, 2, 3])} fill="#ffffff" fillOpacity="0.85" stroke="#94a3b8" strokeWidth="1" />
          {/* Right face */}
          <path d={poly([1, 5, 6, 2])} fill="#e2e8f0" fillOpacity="0.8" stroke="#94a3b8" strokeWidth="1" />
          {/* Top face with grid */}
          <path d={poly([3, 2, 6, 7])} fill="#f1f5f9" fillOpacity="0.9" stroke="#94a3b8" strokeWidth="1" />
          <path d={poly([3, 2, 6, 7])} fill="url(#grid)" opacity="0.3" />
        </g>

        {/* Placed products with product label rendering */}
        <AnimatePresence>
          {productLabels.map(({ item, p, frontCx, frontCy, frontW, frontH, topPoly, frontPoly, rightPoly, baseColor, iw, ih, id_ }) => {
            const topColor = lighten(baseColor, 32);
            const frontColor = baseColor;
            const sideColor = darken(baseColor, 22);
            const strokeColor = darken(baseColor, 25);

            const pkg = item.product.packagingType;

            // Determine visual style based on packaging type
            let topFill = topColor;
            let frontFill = frontColor;
            let sideFill = sideColor;
            let stroke = strokeColor;
            let strokeWidth = 0.4;

            // Special packaging visual tweaks
            if (pkg === 'can') {
              stroke = darken(baseColor, 40);
              strokeWidth = 0.5;
            } else if (pkg === 'bottle') {
              stroke = darken(baseColor, 30);
            } else if (pkg === 'jar') {
              frontFill = lighten(baseColor, 5);
            }

            const faceSize = Math.min(iw, ih, id_);
            const showLabel = faceSize > 8;

            return (
              <motion.g
                key={item.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                {/* 3D box faces with product color */}
                <polygon points={topPoly} fill={topFill} stroke={stroke} strokeWidth={strokeWidth} opacity="0.95" />
                <polygon points={frontPoly} fill={frontFill} stroke={stroke} strokeWidth={strokeWidth} opacity="0.95" />
                <polygon points={rightPoly} fill={sideFill} stroke={stroke} strokeWidth={strokeWidth} opacity="0.95" />

                {/* Packaging-specific details */}
                {pkg === 'can' && (
                  <>
                    <line x1={p[3].sx} y1={p[3].sy} x2={p[2].sx} y2={p[2].sy} stroke={darken(baseColor, 40)} strokeWidth="0.6" opacity="0.7" />
                    {ih > 12 && (
                      <polygon
                        points={`${p[0].sx},${p[0].sy * 0.7 + p[3].sy * 0.3} ${p[1].sx},${p[1].sy * 0.7 + p[2].sy * 0.3} ${p[1].sx},${p[1].sy * 0.4 + p[2].sy * 0.6} ${p[0].sx},${p[0].sy * 0.4 + p[3].sy * 0.6}`}
                        fill={lighten(baseColor, 55)}
                        opacity="0.4"
                      />
                    )}
                  </>
                )}

                {pkg === 'bottle' && ih > 20 && iw > 15 && (
                  <rect
                    x={(p[3].sx + p[7].sx) / 2 - 3}
                    y={p[3].sy - 2}
                    width={6}
                    height={3}
                    fill={darken(baseColor, 50)}
                    rx="1"
                    opacity="0.8"
                  />
                )}

                {pkg === 'jar' && ih > 15 && (
                  <line
                    x1={p[0].sx} y1={p[0].sy + (p[3].sy - p[0].sy) * 0.15}
                    x2={p[1].sx} y2={p[1].sy + (p[2].sy - p[1].sy) * 0.15}
                    stroke={darken(baseColor, 35)}
                    strokeWidth="1.2"
                    opacity="0.6"
                  />
                )}

                {pkg === 'pouch' && (
                  <line
                    x1={p[0].sx} y1={p[0].sy + (p[3].sy - p[0].sy) * 0.08}
                    x2={p[1].sx} y2={p[1].sy + (p[2].sy - p[1].sy) * 0.08}
                    stroke={darken(baseColor, 35)}
                    strokeWidth="0.8"
                    strokeDasharray="1,0.5"
                    opacity="0.5"
                  />
                )}

                {/* ─── PRODUCT LABEL (foreignObject) ─── */}
                {showLabel && (
                  <foreignObject
                    x={frontCx - Math.max(20, frontW * 0.4)}
                    y={frontCy - Math.max(14, frontH * 0.25)}
                    width={Math.max(40, frontW * 0.8)}
                    height={Math.max(28, frontH * 0.5)}
                    style={{ pointerEvents: 'none', overflow: 'visible' }}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0px',
                        pointerEvents: 'none',
                        userSelect: 'none',
                      }}
                    >
                      {/* Product emoji */}
                      <div style={{
                        fontSize: `${Math.max(12, Math.min(faceSize * 0.35, 22))}px`,
                        lineHeight: 1,
                        textAlign: 'center',
                      }}>
                        {item.product.emoji}
                      </div>
                      {/* Product name */}
                      {faceSize > 18 && (
                        <div style={{
                          fontSize: `${Math.max(4, Math.min(faceSize * 0.13, 7))}px`,
                          fontWeight: 700,
                          color: isLight(baseColor) ? '#374151' : '#f9fafb',
                          textAlign: 'center',
                          lineHeight: '1.1',
                          maxWidth: '100%',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textShadow: isLight(baseColor)
                            ? '0 0 2px rgba(255,255,255,0.8)'
                            : '0 0 2px rgba(0,0,0,0.5)',
                          padding: '0 1px',
                        }}>
                          {truncateText(item.product.nameEs, 20)}
                        </div>
                      )}
                      {/* Weight */}
                      {faceSize > 28 && (
                        <div style={{
                          fontSize: `${Math.max(3, Math.min(faceSize * 0.09, 5.5))}px`,
                          color: isLight(baseColor) ? '#6b7280' : 'rgba(255,255,255,0.75)',
                          textAlign: 'center',
                          lineHeight: '1.1',
                          textShadow: isLight(baseColor)
                            ? '0 0 2px rgba(255,255,255,0.8)'
                            : '0 0 2px rgba(0,0,0,0.5)',
                        }}>
                          {item.product.weight} lb · ${item.product.price.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </foreignObject>
                )}

                {/* Fallback: just emoji for very small items */}
                {!showLabel && (
                  <text
                    x={(p[0].sx + p[6].sx) / 2}
                    y={(p[0].sy + p[6].sy) / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={Math.max(5, faceSize * 0.3)}
                    className="pointer-events-none select-none"
                  >
                    {item.product.emoji}
                  </text>
                )}
              </motion.g>
            );
          })}
        </AnimatePresence>

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

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  const cut = text.substring(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 0 ? cut.substring(0, lastSpace) : cut;
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
