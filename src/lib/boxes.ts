export interface BoxConfig {
  id: string;
  name: string;
  width: number;  // inches
  height: number; // inches
  depth: number;  // inches
  maxWeight: number; // pounds
  price: number;     // USD - shipping cost
  managementFee: number; // USD - per box
  description: string;
  popular?: boolean;
}

export const BOXES: BoxConfig[] = [
  {
    id: 'small',
    name: 'Caja Pequeña',
    width: 12,
    height: 12,
    depth: 12,
    maxWeight: 60,
    price: 45,
    managementFee: 6.6,
    description: '12" × 12" × 12" — Hasta 60 lbs — Envío $45',
  },
  {
    id: 'medium',
    name: 'Caja Mediana',
    width: 15,
    height: 15,
    depth: 15,
    maxWeight: 100,
    price: 65,
    managementFee: 6.6,
    description: '15" × 15" × 15" — Hasta 100 lbs — Envío $65',
    popular: true,
  },
  {
    id: 'large',
    name: 'Caja Grande',
    width: 16,
    height: 16,
    depth: 16,
    maxWeight: 100,
    price: 85,
    managementFee: 6.6,
    description: '16" × 16" × 16" — Hasta 100 lbs — Envío $85',
  },
];
