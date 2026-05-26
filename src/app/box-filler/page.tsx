'use client';

import { useState } from 'react';
import Header from '@/components/chambatina/Header';
import BoxSelector from '@/components/chambatina/BoxSelector';
import ProductCatalog from '@/components/chambatina/ProductCatalog';
import Box3DView from '@/components/chambatina/Box3DView';
import MobileOrderSummary from '@/components/chambatina/MobileOrderSummary';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const selectedBox = useBoxFillerStore((s) => s.selectedBox);
  const boxVol = selectedBox.width * selectedBox.height * selectedBox.depth;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-6">
        {/* Step 1: Box Selector */}
        <section className="mb-5 sm:mb-8">
          <h2 className="text-sm sm:text-base font-bold mb-2.5 sm:mb-3 flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs flex items-center justify-center font-bold">
              1
            </span>
            Elige el tamaño de tu caja
          </h2>
          <BoxSelector />
        </section>

        <Separator className="mb-5 sm:mb-8" />

        {/* Step 2: Products + Box + Summary */}
        <section>
          <h2 className="text-sm sm:text-base font-bold mb-3 sm:mb-4 flex items-center gap-2">
            <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-primary-foreground text-[10px] sm:text-xs flex items-center justify-center font-bold">
              2
            </span>
            Selecciona productos para tu caja
            <span className="text-[9px] sm:text-xs text-muted-foreground font-normal ml-1">
              ({selectedBox.width}&quot;×{selectedBox.height}&quot;×{selectedBox.depth}&quot; ·{' '}
              {boxVol.toFixed(0)} in³ · hasta {selectedBox.maxWeight} lbs)
            </span>
          </h2>

          {/* Desktop: 3-column grid */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-5">
              <ProductCatalog />
            </div>
            <div className="lg:col-span-4">
              <Card className="p-4 sticky top-4">
                <h3 className="text-sm font-bold mb-3 text-center">
                  Vista de la Caja — Tiempo Real
                </h3>
                <Box3DView />
              </Card>
            </div>
            <div className="lg:col-span-3">
              <div className="sticky top-4">
                <MobileOrderSummary />
              </div>
            </div>
          </div>

          {/* Mobile/Tablet: Single column scroll — Box 3D first, then products, then cart */}
          <div className="lg:hidden space-y-4">
            {/* 3D Box — compact on mobile */}
            <Card className="p-3">
              <h3 className="text-xs font-bold mb-2 text-center text-muted-foreground">
                Vista de la Caja — Tiempo Real
              </h3>
              <Box3DView />
            </Card>

            {/* Product catalog */}
            <ProductCatalog />

            {/* Order summary / Cart — always visible */}
            <MobileOrderSummary />
          </div>
        </section>

        {/* How it works — hidden on very small screens */}
        <section className="mt-6 sm:mt-8 mb-4 hidden sm:block">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3">
              Cómo funciona Chambatina
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-amber-700 dark:text-amber-400">
              <div>
                <p className="font-semibold mb-1">1. Elige tu caja</p>
                <p>
                  Tres tamaños disponibles. Cada caja tiene límites de peso Y volumen.
                  Cuando cualquiera de los dos llegue al máximo, la caja se cierra automáticamente.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Llena con productos Walmart</p>
                <p>
                  Elige de nuestro catálogo de productos reales de Walmart. Los precios incluyen
                  el tax de Walmart (~7%). Puedes repetir productos.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. Completa tu pedido</p>
                <p>
                  El precio total incluye: costo de productos + tax Walmart + envío +
                  fee de gestión (${selectedBox.managementFee.toFixed(2)} por caja).
                  Cuando la caja esté llena, presiona &quot;Pagar&quot;.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer — hidden on mobile to save space */}
      <footer className="border-t bg-background/80 backdrop-blur mt-auto hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2025 Chambatina — Walmart a tu Familia</p>
          <p>
            Precios de Walmart sujetos a cambio · Tax ~7% incluido
          </p>
        </div>
      </footer>
    </div>
  );
}
