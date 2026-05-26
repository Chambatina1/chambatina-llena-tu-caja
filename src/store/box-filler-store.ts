import { create } from 'zustand';
import { BoxConfig, BOXES } from '@/lib/boxes';
import { Product } from '@/lib/products';

interface PlacedItem {
  id: string;
  product: Product;
  quantity: number;
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
  d: number;
}

export type RejectionReason = 'peso' | 'espacio' | null;

interface BoxFillerState {
  selectedBox: BoxConfig;
  items: PlacedItem[];
  categoryFilter: string;

  // Actions
  setSelectedBox: (box: BoxConfig) => void;
  setCategoryFilter: (category: string) => void;
  addProduct: (product: Product) => boolean;
  removeProduct: (itemId: string) => void;
  clearBox: () => void;
  canAddProduct: (product: Product) => boolean;
  rejectReason: (product: Product) => RejectionReason;

  // Computed
  currentWeight: () => number;
  currentVolume: () => number;
  productCost: () => number;
  walmartTax: () => number;
  totalCost: () => number;
  remainingWeight: () => number;
  remainingVolume: () => number;
  weightPercentage: () => number;
  volumePercentage: () => number;
  boxFull: () => boolean;
  boxFullReason: () => 'peso' | 'volumen' | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// SMART 3D BIN-PACKING
// - Tries ALL 6 rotations of the product (W×H×D permutations)
// - Phase 1: Corner-based candidates (all 7 upper corners + level projections)
// - Phase 2: Coarse 0.5" grid scan at occupied z-levels (fallback)
// - Tightly fits items without gaps, finds placements corner-only approach misses
// ─────────────────────────────────────────────────────────────────────────────

function getRotations(pw: number, ph: number, pd: number) {
  return [
    [pw, ph, pd],
    [pw, pd, ph],
    [ph, pw, pd],
    [ph, pd, pw],
    [pd, pw, ph],
    [pd, ph, pw],
  ];
}

function collides(
  x: number, y: number, z: number, w: number, h: number, d: number,
  item: PlacedItem
): boolean {
  return (
    x < item.x + item.w &&
    x + w > item.x &&
    y < item.y + item.h &&
    y + h > item.y &&
    z < item.z + item.d &&
    z + d > item.z
  );
}

function fitsBox(x: number, y: number, z: number, w: number, h: number, d: number, boxW: number, boxH: number, boxD: number): boolean {
  return x >= 0 && y >= 0 && z >= 0 &&
    x + w <= boxW + 0.01 &&
    y + h <= boxH + 0.01 &&
    z + d <= boxD + 0.01;
}

/**
 * Check if a single point is inside the volume of any placed item.
 * Used to cheaply skip grid points that can never be valid placement origins.
 */
function isPointInsideAnyItem(
  px: number, py: number, pz: number,
  items: PlacedItem[]
): boolean {
  for (const item of items) {
    if (
      px >= item.x && px < item.x + item.w &&
      py >= item.y && py < item.y + item.h &&
      pz >= item.z && pz < item.z + item.d
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Try placing the product at each candidate position with each rotation.
 * Returns the best (lowest-score) valid placement, or null if none found.
 */
function tryPlacements(
  candidates: number[][],
  rotations: number[][],
  items: PlacedItem[],
  boxW: number,
  boxH: number,
  boxD: number,
  currentBestScore: number
): { x: number; y: number; z: number; w: number; h: number; d: number; score: number } | null {
  let best: { x: number; y: number; z: number; w: number; h: number; d: number; score: number } | null = null;
  let bestScore = currentBestScore;

  for (const [rw, rh, rd] of rotations) {
    // Skip rotation if it doesn't fit in the box at all
    if (rw > boxW + 0.01 || rh > boxH + 0.01 || rd > boxD + 0.01) continue;

    for (const [cx, cy, cz] of candidates) {
      const x = Math.max(0, cx);
      const y = Math.max(0, cy);
      const z = Math.max(0, cz);

      // Check box bounds
      if (!fitsBox(x, y, z, rw, rh, rd, boxW, boxH, boxD)) continue;

      // Check collisions with all placed items
      let hasCollision = false;
      for (const item of items) {
        if (collides(x, y, z, rw, rh, rd, item)) {
          hasCollision = true;
          break;
        }
      }
      if (hasCollision) continue;

      // Score: prefer bottom-front-left placement (stable stacking)
      const score = z * 10000 + y * 100 + x;
      if (score < bestScore) {
        bestScore = score;
        best = { x, y, z, w: rw, h: rh, d: rd, score };
      }
    }
  }

  return best;
}

function findPosition(
  items: PlacedItem[],
  product: Product,
  boxW: number,
  boxH: number,
  boxD: number
): { x: number; y: number; z: number; w: number; h: number; d: number } | null {

  const rotations = getRotations(product.width, product.height, product.depth);

  // ── Phase 1: Smart corner-based candidates ──

  const candidateSet = new Set<string>();
  const candidates: number[][] = [];

  const addCandidate = (x: number, y: number, z: number) => {
    const key = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    if (!candidateSet.has(key)) {
      candidateSet.add(key);
      candidates.push([x, y, z]);
    }
  };

  // 1a. Origin corner
  addCandidate(0, 0, 0);

  // 1b. All 7 upper corners of each placed item (not just 3 per-axis corners)
  for (const item of items) {
    // Single-axis edges (existing from before)
    addCandidate(item.x + item.w, item.y, item.z);
    addCandidate(item.x, item.y + item.h, item.z);
    addCandidate(item.x, item.y, item.z + item.d);
    // Two-axis edge combinations (NEW)
    addCandidate(item.x + item.w, item.y + item.h, item.z);
    addCandidate(item.x + item.w, item.y, item.z + item.d);
    addCandidate(item.x, item.y + item.h, item.z + item.d);
    // Three-axis corner (NEW)
    addCandidate(item.x + item.w, item.y + item.h, item.z + item.d);
  }

  // 1c. Collect all occupied z-levels (bottom and top of each item)
  const zLevels = new Set<number>();
  zLevels.add(0);
  for (const item of items) {
    zLevels.add(item.z);
    zLevels.add(item.z + item.d);
  }

  // 1d. Level-based corner projections: at each occupied z-level,
  //     try placing at the origin and at xy-corners of existing items
  for (const zl of zLevels) {
    addCandidate(0, 0, zl);
    for (const item of items) {
      addCandidate(item.x + item.w, item.y, zl);
      addCandidate(item.x, item.y + item.h, zl);
      addCandidate(item.x + item.w, item.y + item.h, zl);
    }
  }

  // Try Phase 1 candidates
  const result1 = tryPlacements(candidates, rotations, items, boxW, boxH, boxD, Infinity);
  if (result1) {
    const { x, y, z, w, h, d } = result1;
    return { x, y, z, w, h, d };
  }

  // ── Phase 2: Coarse grid scan at occupied z-levels (fallback) ──
  // This catches small pockets of space that corner-based candidates miss.

  const gridStep = 0.5; // 0.5-inch grid
  const gridCandidates: number[][] = [];
  const gridSet = new Set<string>();

  for (const zl of zLevels) {
    for (let gx = 0; gx <= boxW; gx += gridStep) {
      for (let gy = 0; gy <= boxH; gy += gridStep) {
        // Skip if origin point is inside an existing item (placement would always collide)
        if (isPointInsideAnyItem(gx, gy, zl, items)) continue;
        // Skip if already checked in Phase 1
        const key = `${gx.toFixed(4)},${gy.toFixed(4)},${zl.toFixed(4)}`;
        if (candidateSet.has(key)) continue;
        if (gridSet.has(key)) continue;
        gridSet.add(key);
        gridCandidates.push([gx, gy, zl]);
      }
    }
  }

  const result2 = tryPlacements(gridCandidates, rotations, items, boxW, boxH, boxD, Infinity);
  if (result2) {
    const { x, y, z, w, h, d } = result2;
    return { x, y, z, w, h, d };
  }

  return null;
}

// Walmart average sales tax ~7%
const WALMART_TAX_RATE = 0.07;

export const useBoxFillerStore = create<BoxFillerState>((set, get) => ({
  selectedBox: BOXES[1],
  items: [],
  categoryFilter: 'Todos',

  setSelectedBox: (box) => set({ selectedBox: box, items: [] }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),

  rejectReason: (product) => {
    const { items, selectedBox } = get();
    const currentW = items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
    if (currentW + product.weight > selectedBox.maxWeight) return 'peso';
    const pos = findPosition(items, product, selectedBox.width, selectedBox.height, selectedBox.depth);
    if (!pos) return 'espacio';
    return null;
  },

  canAddProduct: (product) => {
    const { items, selectedBox } = get();
    const currentW = items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
    if (currentW + product.weight > selectedBox.maxWeight) return false;
    const pos = findPosition(items, product, selectedBox.width, selectedBox.height, selectedBox.depth);
    return pos !== null;
  },

  addProduct: (product) => {
    const { items, selectedBox } = get();
    const currentW = items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
    if (currentW + product.weight > selectedBox.maxWeight) return false;
    const pos = findPosition(items, product, selectedBox.width, selectedBox.height, selectedBox.depth);
    if (!pos) return false;

    const newItem: PlacedItem = {
      id: `${product.id}-${Date.now()}`,
      product,
      quantity: 1,
      x: pos.x,
      y: pos.y,
      z: pos.z,
      w: pos.w,
      h: pos.h,
      d: pos.d,
    };

    set({ items: [...items, newItem] });
    return true;
  },

  removeProduct: (itemId) => {
    set({ items: get().items.filter((item) => item.id !== itemId) });
  },

  clearBox: () => set({ items: [] }),

  currentWeight: () => {
    return get().items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
  },

  currentVolume: () => {
    return get().items.reduce((sum, item) => sum + item.product.volume * item.quantity, 0);
  },

  productCost: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  walmartTax: () => {
    const pCost = get().productCost();
    return pCost * WALMART_TAX_RATE;
  },

  totalCost: () => {
    const { selectedBox, productCost, walmartTax } = get();
    return selectedBox.price + selectedBox.managementFee + productCost() + walmartTax();
  },

  remainingWeight: () => {
    const { selectedBox, currentWeight } = get();
    return Math.max(0, selectedBox.maxWeight - currentWeight());
  },

  remainingVolume: () => {
    const { selectedBox, currentVolume } = get();
    const boxVol = selectedBox.width * selectedBox.height * selectedBox.depth;
    return Math.max(0, boxVol - currentVolume());
  },

  weightPercentage: () => {
    const { selectedBox, currentWeight } = get();
    return Math.min(100, (currentWeight() / selectedBox.maxWeight) * 100);
  },

  volumePercentage: () => {
    const { selectedBox, currentVolume } = get();
    const boxVol = selectedBox.width * selectedBox.height * selectedBox.depth;
    return Math.min(100, (currentVolume() / boxVol) * 100);
  },

  boxFull: () => {
    const wp = get().weightPercentage();
    const vp = get().volumePercentage();
    return wp >= 99.5 || vp >= 99.5;
  },

  boxFullReason: () => {
    const wp = get().weightPercentage();
    const vp = get().volumePercentage();
    if (wp >= 99.5) return 'peso';
    if (vp >= 99.5) return 'volumen';
    return null;
  },
}));
