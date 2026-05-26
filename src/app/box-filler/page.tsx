'use client';

import Header from '@/components/chambatina/Header';
import BoxSelector from '@/components/chambatina/BoxSelector';
import ProductCatalog from '@/components/chambatina/ProductCatalog';
import Box3DView from '@/components/chambatina/Box3DView';
import OrderSummary from '@/components/chambatina/OrderSummary';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function Home() {
  const selectedBox = useBoxFillerStore((s) => s.selectedBox);
  const boxVol = selectedBox.width * selectedBox.height * selectedBox.depth;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {/* Step 1: Box Selector */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              1
            </span>
            Elige el tamaño de tu caja
          </h2>
          <BoxSelector />
        </section>

        <Separator className="mb-8" />

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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Product catalog */}
            <div className="lg:col-span-5 xl:col-span-5">
              <ProductCatalog />
            </div>

            {/* Center: 3D Box visualization */}
            <div className="lg:col-span-4 xl:col-span-4">
              <Card className="p-4 sticky top-4">
                <h3 className="text-sm font-bold mb-3 text-center">
                  Vista de la Caja — Tiempo Real
                </h3>
                <Box3DView />
              </Card>
            </div>

            {/* Right: Order summary */}
            <div className="lg:col-span-3 xl:col-span-3">
              <div className="sticky top-4">
                <OrderSummary />
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

      {/* Footer */}
      <footer className="border-t bg-background/80 backdrop-blur mt-auto">
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
