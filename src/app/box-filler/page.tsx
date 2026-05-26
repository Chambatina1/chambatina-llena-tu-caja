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
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  X,
  ChevronUp,
  Package,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function Home() {
  const selectedBox = useBoxFillerStore((s) => s.selectedBox);
  const items = useBoxFillerStore((s) => s.items);
  const boxVol = selectedBox.width * selectedBox.height * selectedBox.depth;
  const totalCost = useBoxFillerStore((s) => s.totalCost);
  const [showCartSheet, setShowCartSheet] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-4 pb-28 sm:pb-6">
        {/* Step 1: Box Selector */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              1
            </span>
            Elige el tamaño de tu caja
          </h2>
          <BoxSelector />
        </section>

        <Separator className="mb-6" />

        {/* Step 2: Products + Box + Summary */}
        <section>
          <h2 className="text-base font-bold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              2
            </span>
            Selecciona productos para tu caja
            <span className="text-[10px] sm:text-xs text-muted-foreground font-normal ml-1">
              ({selectedBox.width}&quot;×{selectedBox.height}&quot;×{selectedBox.depth}&quot; ·{' '}
              {boxVol.toFixed(0)} in³ · hasta {selectedBox.maxWeight} lbs)
            </span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
            {/* Left: Product catalog (full width on mobile) */}
            <div className="lg:col-span-5 xl:col-span-5 order-2 lg:order-1">
              <ProductCatalog />
            </div>

            {/* Center: 3D Box visualization (FIRST on mobile, sticky on desktop) */}
            <div className="lg:col-span-4 xl:col-span-4 order-1 lg:order-2">
              <Card className="p-3 lg:p-4 sticky top-4">
                <h3 className="text-xs sm:text-sm font-bold mb-2 text-center">
                  Vista de la Caja — Tiempo Real
                </h3>
                <Box3DView />
                {/* Item count badge on mobile */}
                <div className="lg:hidden flex items-center justify-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  <span>{items.length} productos en la caja</span>
                </div>
              </Card>
            </div>

            {/* Right: Order summary (hidden on mobile — using floating cart instead) */}
            <div className="lg:col-span-3 xl:col-span-3 order-3 hidden lg:block">
              <div className="sticky top-4">
                <MobileOrderSummary />
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mt-8 mb-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <h3 className="text-sm font-bold text-amber-800 dark:text-amber-300 mb-3">
              Cómo funciona Chambatina
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-amber-700 dark:text-amber-400">
              <div>
                <p className="font-semibold mb-1">1. Elige tu caja</p>
                <p>
                  Tres tamaños disponibles. Cada caja tiene límites de peso Y volumen.
                  Cuando cualquiera de los dos llegue al 100%, la caja se cierra automáticamente
                  para que quepa todo sin sorpresas.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">2. Llena con productos Walmart</p>
                <p>
                  Elige de nuestro catálogo de productos reales de Walmart. Los precios incluyen
                  el tax de Walmart (~7%). Verás en tiempo real cómo se acomodan en tu caja
                  con cálculo preciso de volumen.
                </p>
              </div>
              <div>
                <p className="font-semibold mb-1">3. Completa tu pedido</p>
                <p>
                  El precio total incluye: costo de productos + tax Walmart + envío +
                  fee de gestión (${selectedBox.managementFee.toFixed(2)} por caja).
                  Cuando la caja esté llena, presiona &quot;Completar Pedido&quot;.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Mobile Floating Cart Bar ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm safe-area-bottom">
        <div className="px-4 py-3">
          <Button
            onClick={() => setShowCartSheet(true)}
            className="w-full h-12 rounded-xl font-bold text-base gap-3 shadow-lg"
            style={{ backgroundColor: items.length > 0 ? '#f97316' : '#94a3b8' }}
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            <span className="text-white flex-1 text-left">
              {items.length > 0
                ? `${items.length} productos — $${totalCost().toFixed(2)}`
                : 'Tu caja está vacía'}
            </span>
            <ChevronUp className="w-5 h-5 text-white" />
          </Button>
        </div>
      </div>

      {/* ── Mobile Cart Sheet (Slide up) ── */}
      <AnimatePresence>
        {showCartSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCartSheet(false)}
              className="fixed inset-0 z-50 bg-black/50 lg:hidden"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl max-h-[90vh] overflow-auto lg:hidden"
            >
              {/* Handle bar */}
              <div className="sticky top-0 z-10 bg-background pt-3 pb-2 px-4 border-b flex items-center justify-between">
                <div className="w-8 h-1 rounded-full bg-muted-foreground/30 mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
                <h3 className="text-sm font-bold flex items-center gap-2 mt-2">
                  <ShoppingCart className="w-4 h-4" />
                  Tu Pedido
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 mt-2"
                  onClick={() => setShowCartSheet(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-4">
                <MobileOrderSummary />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur mt-auto hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>© 2025 Chambatina — Walmart a tu Familia</p>
          <p>
            Precios de Walmart sujetos a cambio · Tax ~7% incluido · Cálculo riguroso de peso y volumen
          </p>
        </div>
      </footer>
    </div>
  );
}
