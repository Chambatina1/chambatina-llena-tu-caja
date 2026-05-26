'use client';

import { BOXES } from '@/lib/boxes';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { Info } from 'lucide-react';

export default function Header() {
  const selectedBox = useBoxFillerStore((s) => s.selectedBox);

  return (
    <header className="w-full border-b bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/30">
      <div className="max-w-7xl mx-auto px-4 py-4">
        {/* Brand */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
              C
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-orange-600 to-amber-700 bg-clip-text text-transparent">
                Chambatina
              </h1>
              <p className="text-[10px] text-muted-foreground -mt-0.5">
                Llena tu Caja — Productos que llegan a tu pueblo
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur rounded-lg px-3 py-1.5">
            <Info className="w-3.5 h-3.5" />
            <span>
              Envío hasta 30 días · Productos que duran · Hasta {Math.max(...BOXES.map((b) => b.maxWeight))} lbs
            </span>
          </div>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center gap-2 text-[10px] sm:text-xs overflow-x-auto pb-1">
          <StepBadge number={1} label="Elige tu caja" active />
          <StepArrow />
          <StepBadge number={2} label="Agrega productos" />
          <StepArrow />
          <StepBadge number={3} label="Completa tu pedido" />
        </div>
      </div>
    </header>
  );
}

function StepBadge({ number, label, active }: { number: number; label: string; active?: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full whitespace-nowrap shrink-0 ${
        active
          ? 'bg-primary text-primary-foreground font-semibold'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-background/20">
        {number}
      </span>
      {label}
    </div>
  );
}

function StepArrow() {
  return <span className="text-muted-foreground text-xs">→</span>;
}
