'use client';

import { useBoxFillerStore } from '@/store/box-filler-store';
import { Info, ShoppingCart } from 'lucide-react';

export default function Header() {
  const items = useBoxFillerStore((s) => s.items);
  const total = useBoxFillerStore((s) => s.totalCost());
  const boxFull = useBoxFillerStore((s) => s.boxFull());

  return (
    <header className="w-full border-b bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/30">
      <div className="max-w-7xl mx-auto px-4 py-3">
        {/* Brand row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
              C
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                Chambatina
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Walmart a tu Familia
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Cart summary in header */}
            {items.length > 0 && (
              <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-3 py-1.5">
                <ShoppingCart className="w-4 h-4" />
                <span className="text-xs font-bold">{items.length} items</span>
                <span className="text-xs font-black">${total.toFixed(2)}</span>
              </div>
            )}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground bg-background/80 backdrop-blur rounded-lg px-2.5 py-1.5">
              <Info className="w-3 h-3" />
              <span>
                Productos Walmart · Tax 7% · Volumen y peso rigurosos
              </span>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs overflow-x-auto pb-0.5">
          <StepBadge number={1} label="Elige tu caja" active />
          <StepArrow />
          <StepBadge number={2} label="Agrega productos" active={items.length > 0} done={boxFull} />
          <StepArrow />
          <StepBadge number={3} label="Completa pedido" active={boxFull} />
        </div>
      </div>
    </header>
  );
}

function StepBadge({ number, label, active, done }: { number: number; label: string; active?: boolean; done?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 transition-colors ${
        done
          ? 'bg-green-500 text-white font-semibold'
          : active
          ? 'bg-primary text-primary-foreground font-semibold'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-background/20">
        {done ? '✓' : number}
      </span>
      {label}
    </div>
  );
}

function StepArrow() {
  return <span className="text-muted-foreground text-xs">→</span>;
}
