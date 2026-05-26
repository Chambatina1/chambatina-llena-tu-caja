'use client';

import { useBoxFillerStore } from '@/store/box-filler-store';

export default function Box3DView() {
  const { items, selectedBox, weightPercentage, volumePercentage, boxFull, boxFullReason } = useBoxFillerStore();

  const { width: bw, height: bh, depth: bd } = selectedBox;

  const maxDim = Math.max(bw, bh, bd);
  const scale = 220 / maxDim;

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

  const viewW = (maxX - minX) + 50;
  const viewH = (maxY - minY) + 50;

  const getBarColor = (pct: number) =>
    pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : pct > 40 ? '#3b82f6' : '#22c55e';

  // Sort items by painter's algorithm
  const sortedItems = [...items].sort((a, b) => {
    if (a.z !== b.z) return a.z - b.z;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  function getProductImage(packagingType: string): string {
    switch (packagingType) {
      case 'can': return '/products/can.png';
      case 'bottle': return '/products/bottle.png';
      case 'bag': return '/products/bag.png';
      case 'jar': return '/products/jar.png';
      case 'box': return '/products/box.png';
      case 'bar': return '/products/bar.png';
      case 'pouch': return '/products/pouch.png';
      default: return '/products/box.png';
    }
  }

  // Draw a cylinder (for cans, jars) in isometric
  function drawCylinder(
    item: typeof sortedItems[0],
    ix: number, iy: number, iz: number,
    iw: number, ih: number, id_: number
  ) {
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

    const clipId = `clip-${item.id.replace(/[^a-zA-Z0-9]/g, '')}`;

    // Front face polygon
    const frontPoly = `${p[0].sx},${p[0].sy} ${p[1].sx},${p[1].sy} ${p[2].sx},${p[2].sy} ${p[3].sx},${p[3].sy}`;
    // Top face
    const topPoly = `${p[3].sx},${p[3].sy} ${p[2].sx},${p[2].sy} ${p[6].sx},${p[6].sy} ${p[7].sx},${p[7].sy}`;
    // Right face
    const rightPoly = `${p[1].sx},${p[1].sy} ${p[5].sx},${p[5].sy} ${p[6].sx},${p[6].sy} ${p[2].sx},${p[2].sy}`;

    // Front face center
    const fcx = (p[0].sx + p[1].sx + p[2].sx + p[3].sx) / 4;
    const fcy = (p[0].sy + p[1].sy + p[2].sy + p[3].sy) / 4;
    const faceW = Math.sqrt(Math.pow(p[1].sx - p[0].sx, 2) + Math.pow(p[1].sy - p[0].sy, 2));
    const faceH = Math.sqrt(Math.pow(p[3].sx - p[0].sx, 2) + Math.pow(p[3].sy - p[0].sy, 2));
    const faceSize = Math.min(iw, ih, id_);

    const baseColor = item.product.color;
    const imgSrc = getProductImage(item.product.packagingType);

    return (
      <g key={item.id}>
        <polygon points={rightPoly} fill={baseColor} opacity="0.25" stroke="#64748b" strokeWidth="0.4" />
        <polygon points={topPoly} fill={baseColor} opacity="0.12" stroke="#64748b" strokeWidth="0.4" />

        <defs>
          <clipPath id={clipId}>
            <polygon points={frontPoly} />
          </clipPath>
          {/* Shadow filter per item */}
          <filter id={`shadow-${clipId}`} x="-5%" y="-5%" width="115%" height="115%">
            <feDropShadow dx="0.5" dy="1" stdDeviation="1" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Background fill for front face */}
        <polygon points={frontPoly} fill={baseColor} opacity="0.15" />

        {/* Product image on front face */}
        <image
          href={imgSrc}
          x={fcx - faceW / 2}
          y={fcy - faceH / 2}
          width={faceW}
          height={faceH}
          preserveAspectRatio="xMidYMid slice"
          clipPath={`url(#${clipId})`}
          opacity="0.95"
        />

        {/* Front face border */}
        <polygon points={frontPoly} fill="none" stroke="#475569" strokeWidth="0.6" opacity="0.5" />

        {/* Product label on front face */}
        {faceSize > 12 && (
          <g>
            <rect
              x={fcx - faceW * 0.38}
              y={fcy - faceH * 0.08}
              width={faceW * 0.76}
              height={faceH * 0.22}
              rx={2}
              fill="rgba(0,0,0,0.65)"
              opacity="0.8"
              clipPath={`url(#${clipId})`}
            />
            <text
              x={fcx}
              y={fcy + faceH * 0.04}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.max(2.5, Math.min(faceSize * 0.11, 6))}
              fontWeight="800"
              fill="#ffffff"
              clipPath={`url(#${clipId})`}
            >
              {item.product.nameEs.length > 20 ? item.product.nameEs.substring(0, 18) + '...' : item.product.nameEs}
            </text>
          </g>
        )}

        {/* Weight/price label for larger items */}
        {faceSize > 20 && (
          <g>
            <rect
              x={fcx - faceW * 0.3}
              y={fcy + faceH * 0.2}
              width={faceW * 0.6}
              height={faceH * 0.14}
              rx={1.5}
              fill="rgba(0,0,0,0.55)"
              clipPath={`url(#${clipId})`}
            />
            <text
              x={fcx}
              y={fcy + faceH * 0.28}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={Math.max(2, Math.min(faceSize * 0.08, 4.5))}
              fill="#4ade80"
              fontWeight="700"
              clipPath={`url(#${clipId})`}
            >
              {item.product.weight} lb · ${item.product.price.toFixed(2)}
            </text>
          </g>
        )}
      </g>
    );
  }

  // Draw a bag/pouch (soft sides, slightly rounded)
  function drawBag(
    item: typeof sortedItems[0],
    ix: number, iy: number, iz: number,
    iw: number, ih: number, id_: number
  ) {
    return drawCylinder(item, ix, iy, iz, iw, ih, id_);
  }

  // Draw a bottle (tall, narrow)
  function drawBottle(
    item: typeof sortedItems[0],
    ix: number, iy: number, iz: number,
    iw: number, ih: number, id_: number
  ) {
    return drawCylinder(item, ix, iy, iz, iw, ih, id_);
  }

  // Draw a box (sharp edges, cardboard look)
  function drawBox(
    item: typeof sortedItems[0],
    ix: number, iy: number, iz: number,
    iw: number, ih: number, id_: number
  ) {
    return drawCylinder(item, ix, iy, iz, iw, ih, id_);
  }

  // Draw a bar (soap bar, flat rectangle)
  function drawBar(
    item: typeof sortedItems[0],
    ix: number, iy: number, iz: number,
    iw: number, ih: number, id_: number
  ) {
    return drawCylinder(item, ix, iy, iz, iw, ih, id_);
  }

  // Draw a pouch (small flat pouch)
  function drawPouch(
    item: typeof sortedItems[0],
    ix: number, iy: number, iz: number,
    iw: number, ih: number, id_: number
  ) {
    return drawCylinder(item, ix, iy, iz, iw, ih, id_);
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
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: getBarColor(vp), width: `${Math.min(100, vp)}%` }} />
        </div>
      </div>

      {/* BOX FULL banner */}
      {isFull && (
        <div className="w-full mb-1.5 bg-red-500 text-white rounded-lg px-3 py-1.5 text-center text-[10px] font-bold">
          {reason === 'peso' ? 'CAJA LLENA — Peso máximo' : 'CAJA LLENA — Volumen máximo'}
        </div>
      )}

      {/* 3D Box with realistic product images */}
      <div className="relative w-full" style={{ aspectRatio: `${viewW}/${viewH + 20}` }}>
        <svg
          viewBox={`${cx - viewW / 2} ${cy - viewH / 2 - 5} ${viewW} ${viewH + 10}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
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
          <ellipse cx={cx} cy={corners[0].sy + 8} rx={(maxX - minX) / 2} ry={12} fill="#000" opacity="0.05" />

          {/* Box wireframe */}
          <g filter="url(#shadow)">
            <path d={poly([0, 1, 2, 3])} fill="#ffffff" fillOpacity="0.6" stroke="#94a3b8" strokeWidth="1.2" />
            <path d={poly([1, 5, 6, 2])} fill="#e2e8f0" fillOpacity="0.5" stroke="#94a3b8" strokeWidth="1.2" />
            <path d={poly([3, 2, 6, 7])} fill="#f1f5f9" fillOpacity="0.7" stroke="#94a3b8" strokeWidth="1.2" />
            <path d={poly([3, 2, 6, 7])} fill="url(#grid)" opacity="0.2" />
          </g>

          {/* Render each product */}
          {sortedItems.map((item) => {
            const ix = item.x * scale;
            const iy = item.y * scale;
            const iz = item.z * scale;
            const iw = item.w * scale;
            const ih = item.h * scale;
            const id_ = item.d * scale;

            switch (item.product.packagingType) {
              case 'can': return drawCylinder(item, ix, iy, iz, iw, ih, id_);
              case 'bottle': return drawBottle(item, ix, iy, iz, iw, ih, id_);
              case 'bag': return drawBag(item, ix, iy, iz, iw, ih, id_);
              case 'jar': return drawCylinder(item, ix, iy, iz, iw, ih, id_);
              case 'box': return drawBox(item, ix, iy, iz, iw, ih, id_);
              case 'bar': return drawBar(item, ix, iy, iz, iw, ih, id_);
              case 'pouch': return drawPouch(item, ix, iy, iz, iw, ih, id_);
              default: return drawBox(item, ix, iy, iz, iw, ih, id_);
            }
          })}

          {/* Dimension labels */}
          <text x={(corners[0].sx + corners[1].sx) / 2} y={corners[0].sy + 14} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600">
            {bw}&quot;
          </text>
          <text x={corners[3].sx - 12} y={(corners[3].sy + corners[0].sy) / 2} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600"
            transform={`rotate(-90, ${corners[3].sx - 12}, ${(corners[3].sy + corners[0].sy) / 2})`}>
            {bh}&quot;
          </text>
          <text x={(corners[4].sx + corners[7].sx) / 2 - 8} y={(corners[4].sy + corners[0].sy) / 2 + 3} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="600"
            transform={`rotate(90, ${(corners[4].sx + corners[7].sx) / 2 - 8}, ${(corners[4].sy + corners[0].sy) / 2 + 3})`}>
            {bd}&quot;
          </text>
        </svg>
      </div>

      {/* Empty state */}
      {items.length === 0 && !isFull && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none top-16">
          <div className="text-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm">
            <p className="text-xs text-gray-500">Selecciona productos para llenar tu caja</p>
          </div>
        </div>
      )}
    </div>
  );
}
