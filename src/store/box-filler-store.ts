import { create } from 'zustand';
import { BoxConfig, BOXES } from '@/lib/boxes';
import { Product, PRODUCTS, ProductInBox } from '@/lib/products';

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
  productCost: () => number;
  totalCost: () => number;
  remainingWeight: () => number;
  weightPercentage: () => number;
  boxItems: () => { product: Product; quantity: number }[];
}

// Simple first-fit packing algorithm
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

  // Try placing at each z level (bottom to top)
  const step = 0.5;
  for (let z = 0; z + pd <= boxD + 0.01; z += step) {
    for (let y = 0; y + ph <= boxH + 0.01; y += step) {
      for (let x = 0; x + pw <= boxW + 0.01; x += step) {
        // Check for collisions
        const hasCollision = items.some(
          (item) =>
            x < item.x + item.w &&
            x + pw > item.x &&
            y < item.y + item.h &&
            y + ph > item.y &&
            z < item.z + item.d &&
            z + pd > item.z
        );
        if (!hasCollision) {
          // Check bounds
          if (x + pw <= boxW + 0.01 && y + ph <= boxH + 0.01 && z + pd <= boxD + 0.01) {
            return { x, y, z, w: pw, h: ph, d: pd };
          }
        }
      }
    }
  }
  return null;
}

export const useBoxFillerStore = create<BoxFillerState>((set, get) => ({
  selectedBox: BOXES[1], // Medium box by default (popular)
  items: [],
  categoryFilter: 'Todos',

  setSelectedBox: (box) => set({ selectedBox: box, items: [] }),

  setCategoryFilter: (category) => set({ categoryFilter: category }),

  canAddProduct: (product) => {
    const { items, selectedBox } = get();
    const currentW = items.reduce((sum, item) => sum + item.product.weight * item.quantity, 0);
    if (currentW + product.weight > selectedBox.maxWeight) return false;

    // Check if there's room in the box
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

  productCost: () => {
    return get().items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  },

  totalCost: () => {
    const { selectedBox, productCost } = get();
    return selectedBox.price + selectedBox.managementFee + productCost();
  },

  remainingWeight: () => {
    const { selectedBox, currentWeight } = get();
    return Math.max(0, selectedBox.maxWeight - currentWeight());
  },

  weightPercentage: () => {
    const { selectedBox, currentWeight } = get();
    return Math.min(100, (currentWeight() / selectedBox.maxWeight) * 100);
  },

  boxItems: () => {
    const { items } = get();
    const grouped: Record<string, { product: Product; quantity: number }> = {};
    for (const item of items) {
      if (grouped[item.product.id]) {
        grouped[item.product.id].quantity += item.quantity;
      } else {
        grouped[item.product.id] = { product: item.product, quantity: item.quantity };
      }
    }
    return Object.values(grouped);
  },
}));
