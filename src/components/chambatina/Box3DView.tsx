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
            animate={{ width: `${wp}%` }}
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

        {/* Placed products — sorted by z for painter's algorithm */}
        <AnimatePresence>
          {[...items]
            .sort((a, b) => {
              // Sort by z then y then x (back to front)
              if (a.z !== b.z) return a.z - b.z;
              if (a.y !== b.y) return a.y - b.y;
              return a.x - b.x;
            })
            .map((item) => {
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
                idx.map((i) => `${p[i].sx},${p[i].sy}`).join(' ');

              const baseColor = item.product.color;
              const pkg = item.product.packagingType;

              return (
                <motion.g
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  style={{
                    transformOrigin: `${(p[0].sx + p[6].sx) / 2}px ${(p[0].sy + p[6].sy) / 2}px`,
                  }}
                >
                  {/* Render based on packaging type */}
                  {pkg === 'can' ? (
                    <CanProduct p={p} baseColor={baseColor} item={item} iw={iw} ih={ih} id_={id_} />
                  ) : pkg === 'bottle' ? (
                    <BottleProduct p={p} baseColor={baseColor} item={item} iw={iw} ih={ih} id_={id_} />
                  ) : pkg === 'bag' ? (
                    <BagProduct p={p} baseColor={baseColor} item={item} iw={iw} ih={ih} id_={id_} />
                  ) : pkg === 'jar' ? (
                    <JarProduct p={p} baseColor={baseColor} item={item} iw={iw} ih={ih} id_={id_} />
                  ) : pkg === 'bar' ? (
                    <BarProduct p={p} baseColor={baseColor} item={item} iw={iw} ih={ih} id_={id_} />
                  ) : pkg === 'pouch' ? (
                    <PouchProduct p={p} baseColor={baseColor} item={item} iw={iw} ih={ih} id_={id_} />
                  ) : (
                    <BoxProduct p={p} baseColor={baseColor} item={item} iw={iw} ih={ih} id_={id_} />
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

// ─────────────────────────────────────────────────────────────────────────────────
// PACKAGING-SPECIFIC PRODUCT RENDERERS
// Each renders the 3 visible faces (top, front, right) with packaging style
// ─────────────────────────────────────────────────────────────────────────────────

function makeTopPoly(p: { sx: number; sy: number }[]) {
  return `${p[3].sx},${p[3].sy} ${p[2].sx},${p[2].sy} ${p[6].sx},${p[6].sy} ${p[7].sx},${p[7].sy}`;
}

function makeFrontPoly(p: { sx: number; sy: number }[]) {
  return `${p[0].sx},${p[0].sy} ${p[1].sx},${p[1].sy} ${p[2].sx},${p[2].sy} ${p[3].sx},${p[3].sy}`;
}

function makeRightPoly(p: { sx: number; sy: number }[]) {
  return `${p[1].sx},${p[1].sy} ${p[5].sx},${p[5].sy} ${p[6].sx},${p[6].sy} ${p[2].sx},${p[2].sy}`;
}

interface RenderProps {
  p: { sx: number; sy: number }[];
  baseColor: string;
  item: { product: { emoji: string; nameEs: string; color: string } };
  iw: number;
  ih: number;
  id_: number;
}

// ─── CAN: cylindrical effect with rounded top, metallic gradient ───
function CanProduct({ p, baseColor, item, iw, ih, id_ }: RenderProps) {
  const topColor = lighten(baseColor, 35);
  const frontColor = baseColor;
  const sideColor = darken(baseColor, 25);
  const rimColor = darken(baseColor, 40);
  const labelColor = lighten(baseColor, 55);
  const textColor = isLight(baseColor) ? '#333' : '#fff';

  return (
    <g>
      {/* Top face (slightly rounded look for cylinder) */}
      <polygon points={makeTopPoly(p)} fill={topColor} stroke={rimColor} strokeWidth="0.5" opacity="0.95" />
      {/* Front face */}
      <polygon points={makeFrontPoly(p)} fill={frontColor} stroke={rimColor} strokeWidth="0.5" opacity="0.95" />
      {/* Right face (darker) */}
      <polygon points={makeRightPoly(p)} fill={sideColor} stroke={rimColor} strokeWidth="0.5" opacity="0.95" />
      {/* Can rim lines at top */}
      <line x1={p[3].sx} y1={p[3].sy} x2={p[2].sx} y2={p[2].sy} stroke={rimColor} strokeWidth="0.6" opacity="0.7" />
      <line x1={p[0].sx} y1={p[0].sy} x2={p[1].sx} y2={p[1].sy} stroke={rimColor} strokeWidth="0.4" opacity="0.5" />
      {/* Label band on front face */}
      {(ih > 12) && (
        <polygon
          points={`${p[0].sx},${p[0].sy * 0.7 + p[3].sy * 0.3} ${p[1].sx},${p[1].sy * 0.7 + p[2].sy * 0.3} ${p[1].sx},${p[1].sy * 0.4 + p[2].sy * 0.6} ${p[0].sx},${p[0].sy * 0.4 + p[3].sy * 0.6}`}
          fill={labelColor}
          opacity="0.4"
        />
      )}
      {/* Emoji on top face */}
      {renderEmoji(p, item, iw, ih, id_)}
    </g>
  );
}

// ─── BOTTLE: tall shape with neck and cap suggestion ───
function BottleProduct({ p, baseColor, item, iw, ih, id_ }: RenderProps) {
  const topColor = lighten(baseColor, 30);
  const frontColor = baseColor;
  const sideColor = darken(baseColor, 20);
  const capColor = darken(baseColor, 50);

  return (
    <g>
      {/* Top face */}
      <polygon points={makeTopPoly(p)} fill={topColor} stroke={darken(baseColor, 30)} strokeWidth="0.4" opacity="0.95" />
      {/* Front face */}
      <polygon points={makeFrontPoly(p)} fill={frontColor} stroke={darken(baseColor, 30)} strokeWidth="0.4" opacity="0.95" />
      {/* Right face */}
      <polygon points={makeRightPoly(p)} fill={sideColor} stroke={darken(baseColor, 30)} strokeWidth="0.4" opacity="0.95" />
      {/* Cap suggestion (small rectangle at top center) */}
      {(ih > 20 && iw > 15) && (
        <rect
          x={(p[3].sx + p[7].sx) / 2 - 3}
          y={p[3].sy - 2}
          width={6}
          height={3}
          fill={capColor}
          rx="1"
          opacity="0.8"
        />
      )}
      {/* Glass/plastic shine line */}
      <line
        x1={p[0].sx + (p[3].sx - p[0].sx) * 0.15}
        y1={p[0].sy + (p[3].sy - p[0].sy) * 0.15}
        x2={p[1].sx + (p[2].sy - p[1].sy) * 0.15}
        y2={p[1].sy + (p[2].sy - p[1].sy) * 0.15}
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      {renderEmoji(p, item, iw, ih, id_)}
    </g>
  );
}

// ─── BAG: rounded corners, puffy gradient ───
function BagProduct({ p, baseColor, item, iw, ih, id_ }: RenderProps) {
  const topColor = lighten(baseColor, 30);
  const frontColor = baseColor;
  const sideColor = darken(baseColor, 20);

  // Calculate "rounded" polygon with slight inflation
  const inflate = 0.02;
  const f = inflate;

  return (
    <g>
      <polygon points={makeTopPoly(p)} fill={topColor} stroke={darken(baseColor, 25)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeFrontPoly(p)} fill={frontColor} stroke={darken(baseColor, 25)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeRightPoly(p)} fill={sideColor} stroke={darken(baseColor, 25)} strokeWidth="0.4" opacity="0.95" />
      {/* Crease/fold lines on front face for bag look */}
      {(ih > 20 && iw > 20) && (
        <g opacity="0.15" stroke={darken(baseColor, 40)} strokeWidth="0.3">
          <line x1={p[0].sx} y1={p[0].sy} x2={p[3].sx} y2={p[3].sy} />
          <line x1={p[1].sx} y1={p[1].sy} x2={p[2].sx} y2={p[2].sy} />
        </g>
      )}
      {renderEmoji(p, item, iw, ih, id_)}
    </g>
  );
}

// ─── JAR: wider shape with lid band and label ───
function JarProduct({ p, baseColor, item, iw, ih, id_ }: RenderProps) {
  const topColor = lighten(baseColor, 25);
  const frontColor = baseColor;
  const sideColor = darken(baseColor, 18);
  const lidColor = darken(baseColor, 35);

  return (
    <g>
      <polygon points={makeTopPoly(p)} fill={topColor} stroke={darken(baseColor, 28)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeFrontPoly(p)} fill={frontColor} stroke={darken(baseColor, 28)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeRightPoly(p)} fill={sideColor} stroke={darken(baseColor, 28)} strokeWidth="0.4" opacity="0.95" />
      {/* Lid band on front face */}
      <line
        x1={p[0].sx} y1={p[0].sy + (p[3].sy - p[0].sy) * 0.15}
        x2={p[1].sx} y2={p[1].sy + (p[2].sy - p[1].sy) * 0.15}
        stroke={lidColor}
        strokeWidth="1.2"
        opacity="0.6"
      />
      {/* Label area on front (subtle) */}
      {(ih > 15 && iw > 15) && (
        <rect
          x={(p[0].sx + p[3].sx) / 2 + 2}
          y={(p[0].sy + p[3].sy) / 2 + 2}
          width={Math.max(4, (iw - 4))}
          height={Math.max(3, (ih - 8))}
          fill="rgba(255,255,255,0.15)"
          rx="1"
        />
      )}
      {renderEmoji(p, item, iw, ih, id_)}
    </g>
  );
}

// ─── BAR: flat with segment lines ───
function BarProduct({ p, baseColor, item, iw, ih, id_ }: RenderProps) {
  const topColor = lighten(baseColor, 25);
  const frontColor = baseColor;
  const sideColor = darken(baseColor, 15);

  return (
    <g>
      <polygon points={makeTopPoly(p)} fill={topColor} stroke={darken(baseColor, 20)} strokeWidth="0.3" opacity="0.95" />
      <polygon points={makeFrontPoly(p)} fill={frontColor} stroke={darken(baseColor, 20)} strokeWidth="0.3" opacity="0.95" />
      <polygon points={makeRightPoly(p)} fill={sideColor} stroke={darken(baseColor, 20)} strokeWidth="0.3" opacity="0.95" />
      {/* Horizontal segment/wrapper lines */}
      {ih > 8 && (
        <g opacity="0.2" stroke={darken(baseColor, 30)} strokeWidth="0.3">
          {Array.from({ length: Math.min(4, Math.floor(ih / 8)) }, (_, i) => {
            const frac = (i + 1) / (Math.floor(ih / 8) + 1);
            const y1 = p[0].sy + (p[3].sy - p[0].sy) * frac;
            const y2 = p[1].sy + (p[2].sy - p[1].sy) * frac;
            return <line key={i} x1={p[0].sx} y1={y1} x2={p[1].sx} y2={y2} />;
          })}
        </g>
      )}
      {renderEmoji(p, item, iw, ih, id_)}
    </g>
  );
}

// ─── POUCH: flat with zip-lock top ───
function PouchProduct({ p, baseColor, item, iw, ih, id_ }: RenderProps) {
  const topColor = lighten(baseColor, 28);
  const frontColor = baseColor;
  const sideColor = darken(baseColor, 18);
  const zipColor = darken(baseColor, 35);

  return (
    <g>
      <polygon points={makeTopPoly(p)} fill={topColor} stroke={darken(baseColor, 22)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeFrontPoly(p)} fill={frontColor} stroke={darken(baseColor, 22)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeRightPoly(p)} fill={sideColor} stroke={darken(baseColor, 22)} strokeWidth="0.4" opacity="0.95" />
      {/* Zip-lock line at top of front face */}
      <line
        x1={p[0].sx} y1={p[0].sy + (p[3].sy - p[0].sy) * 0.08}
        x2={p[1].sx} y2={p[1].sy + (p[2].sy - p[1].sy) * 0.08}
        stroke={zipColor}
        strokeWidth="0.8"
        strokeDasharray="1,0.5"
        opacity="0.5"
      />
      {renderEmoji(p, item, iw, ih, id_)}
    </g>
  );
}

// ─── BOX: clean rectangular with cardboard texture ───
function BoxProduct({ p, baseColor, item, iw, ih, id_ }: RenderProps) {
  const topColor = lighten(baseColor, 32);
  const frontColor = baseColor;
  const sideColor = darken(baseColor, 22);

  return (
    <g>
      <polygon points={makeTopPoly(p)} fill={topColor} stroke={darken(baseColor, 25)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeFrontPoly(p)} fill={frontColor} stroke={darken(baseColor, 25)} strokeWidth="0.4" opacity="0.95" />
      <polygon points={makeRightPoly(p)} fill={sideColor} stroke={darken(baseColor, 25)} strokeWidth="0.4" opacity="0.95" />
      {/* Cardboard fold lines */}
      {(ih > 20 && iw > 20) && (
        <g opacity="0.1" stroke={darken(baseColor, 30)} strokeWidth="0.3">
          <line x1={(p[0].sx + p[1].sx) / 2} y1={p[0].sy} x2={(p[3].sx + p[2].sx) / 2} y2={p[3].sy} />
          <line x1={(p[0].sx + p[3].sx) / 2} y1={(p[0].sy + p[3].sy) / 2} x2={(p[1].sx + p[2].sx) / 2} y2={(p[1].sy + p[2].sy) / 2} />
        </g>
      )}
      {renderEmoji(p, item, iw, ih, id_)}
    </g>
  );
}

// ─── Shared emoji + label renderer on TOP face ───
function renderEmoji(
  p: { sx: number; sy: number }[],
  item: { product: { emoji: string; nameEs: string; color: string } },
  iw: number,
  ih: number,
  id_: number,
) {
  const faceSize = Math.min(iw, ih, id_);
  if (faceSize < 6) return null;

  const tcx = (p[3].sx + p[6].sx) / 2;
  const tcy = (p[3].sy + p[6].sy) / 2;

  const fontSize = Math.max(5, Math.min(faceSize * 0.28, 14));
  const labelFontSize = Math.max(0, fontSize - 4);

  return (
    <g>
      <text
        x={tcx}
        y={tcy - (labelFontSize > 0 ? 2 : 0)}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        className="pointer-events-none select-none"
      >
        {item.product.emoji}
      </text>
      {/* Product name abbreviation on top face if large enough */}
      {faceSize > 25 && (
        <text
          x={tcx}
          y={tcy + fontSize * 0.7}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={Math.min(labelFontSize, 6)}
          fill={isLight(item.product.color) ? '#555' : 'rgba(255,255,255,0.85)'}
          className="pointer-events-none select-none"
          fontWeight="500"
        >
          truncateText(item.product.nameEs, 18)
        </text>
      )}
    </g>
  );
}

function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  // Try to cut at a word boundary
  const cut = text.substring(0, maxLen - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return lastSpace > 0 ? cut.substring(0, lastSpace) : cut;
}

// ─── Color utilities ───
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
