import { create } from 'zustand';
import { BoxConfig, BOXES } from '@/lib/boxes';
import { Product, PRODUCTS } from '@/lib/products';

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
// RIGOROUS 3D BIN-PACKING — Step 0.5" grid
// Checks BOTH weight AND volume capacity before placing
// ─────────────────────────────────────────────────────────────────────────────
function findPosition(
  items: PlacedItem[],
  product: Product,
  boxW: number,
  boxH: number,
  boxD: number
): { x: number; y: number; z: number; w: number; h: number; d: number } | null {
  const pw = product.width;
  const ph = product.height;
  const pd = product.depth;

  // Try all positions on a 0.5" grid
  const step = 0.5;
  for (let z = 0; z + pd <= boxD + 0.01; z += step) {
    for (let y = 0; y + ph <= boxH + 0.01; y += step) {
      for (let x = 0; x + pw <= boxW + 0.01; x += step) {
        // Collision detection with all placed items
        let hasCollision = false;
        for (const item of items) {
          if (
            x < item.x + item.w + 0.01 &&
            x + pw > item.x - 0.01 &&
            y < item.y + item.h + 0.01 &&
            y + ph > item.y - 0.01 &&
            z < item.z + item.d + 0.01 &&
            z + pd > item.z - 0.01
          ) {
            hasCollision = true;
            break;
          }
        }
        if (!hasCollision) {
          // Verify it fits within box boundaries
          if (
            x + pw <= boxW + 0.01 &&
            y + ph <= boxH + 0.01 &&
            z + pd <= boxD + 0.01
          ) {
            return { x, y, z, w: pw, h: ph, d: pd };
          }
        }
      }
    }
  }
  return null;
}

// Walmart average sales tax ~7%
const WALMART_TAX_RATE = 0.07;

export const useBoxFillerStore = create<BoxFillerState>((set, get) => ({
  selectedBox: BOXES[1], // Medium box by default (popular)
  items: [],
  categoryFilter: 'Todos',

  setSelectedBox: (box) => set({ selectedBox: box, items: [] }),

  setCategoryFilter: (category) => set({ categoryFilter: category }),

  canAddProduct: (product) => {
    const { items, selectedBox } = get();

    // CHECK WEIGHT
    const currentW = items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
    if (currentW + product.weight > selectedBox.maxWeight) return false;

    // CHECK VOLUME (bin-packing)
    const pos = findPosition(items, product, selectedBox.width, selectedBox.height, selectedBox.depth);
    return pos !== null;
  },

  addProduct: (product) => {
    const { items, selectedBox } = get();

    // CHECK WEIGHT
    const currentW = items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
    if (currentW + product.weight > selectedBox.maxWeight) return false;

    // CHECK VOLUME (bin-packing)
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
    return get().weightPercentage() >= 99.5 || get().volumePercentage() >= 99.5;
  },

  boxFullReason: () => {
    const wp = get().weightPercentage();
    const vp = get().volumePercentage();
    if (wp >= 99.5) return 'peso';
    if (vp >= 99.5) return 'volumen';
    return null;
  },
}));
