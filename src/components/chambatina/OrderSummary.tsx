'use client';

import { useBoxFillerStore } from '@/store/box-filler-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Trash2,
  ShoppingCart,
  Truck,
  FileText,
  AlertTriangle,
  Lock,
  Scale,
  BoxIcon,
  CheckCircle2,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderSummary() {
  const {
    selectedBox,
    items,
    currentWeight,
    currentVolume,
    productCost,
    walmartTax,
    totalCost,
    remainingWeight,
    remainingVolume,
    weightPercentage,
    volumePercentage,
    boxFull,
    boxFullReason,
    removeProduct,
    clearBox,
  } = useBoxFillerStore();

  const wp = weightPercentage();
  const vp = volumePercentage();
  const isFull = boxFull();
  const reason = boxFullReason();
  const weight = currentWeight();
  const volume = currentVolume();
  const pCost = productCost();
  const wTax = walmartTax();
  const tCost = totalCost();
  const remW = remainingWeight();
  const remV = remainingVolume();
  const boxVol = selectedBox.width * selectedBox.height * selectedBox.depth;

  const getBarColor = (pct: number) =>
    pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : pct > 40 ? '#3b82f6' : '#22c55e';

  // Group items by product
  const grouped: Record<string, { product: typeof items[0]['product']; quantity: number; ids: string[] }> = {};
  items.forEach((item) => {
    if (grouped[item.product.id]) {
      grouped[item.product.id].quantity += 1;
      grouped[item.product.id].ids.push(item.id);
    } else {
      grouped[item.product.id] = {
        product: item.product,
        quantity: 1,
        ids: [item.id],
      };
    }
  });

  return (
    <Card className="p-4 flex flex-col gap-3 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Tu Pedido
        </h3>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={clearBox}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Vaciar
          </Button>
        )}
      </div>

      {/* Box info */}
      <div className="bg-muted/50 rounded-lg p-2.5 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Caja:</span>
          <span className="font-semibold">
            {selectedBox.width}&quot;×{selectedBox.height}&quot;×{selectedBox.depth}&quot;
          </span>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Volumen total: {boxVol.toFixed(0)} in³</span>
          <span>Peso máx: {selectedBox.maxWeight} lbs</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <Truck className="w-3 h-3" /> Envío:
          </span>
          <span className="font-semibold">${selectedBox.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground flex items-center gap-1">
            <FileText className="w-3 h-3" /> Gestión:
          </span>
          <span className="font-semibold">${selectedBox.managementFee.toFixed(2)}</span>
        </div>
      </div>

      {/* Weight bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium flex items-center gap-1">
            <Scale className="w-3 h-3" />
            Peso
          </span>
          <span className="font-bold" style={{ color: getBarColor(wp) }}>
            {weight.toFixed(1)} / {selectedBox.maxWeight} lbs
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getBarColor(wp) }}
            animate={{ width: `${wp}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {remW.toFixed(1)} lbs disponibles
        </p>
      </div>

      {/* Volume bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium flex items-center gap-1">
            <BoxIcon className="w-3 h-3" />
            Volumen
          </span>
          <span className="font-bold" style={{ color: getBarColor(vp) }}>
            {volume.toFixed(0)} / {boxVol.toFixed(0)} in³
          </span>
        </div>
        <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: getBarColor(vp) }}
            animate={{ width: `${vp}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {remV.toFixed(0)} in³ disponibles
        </p>
      </div>

      {/* Box full warning */}
      <AnimatePresence>
        {isFull && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400 mb-1">
                <Lock className="w-3.5 h-3.5" />
                CAJA LLENA
              </div>
              <p className="text-red-600/80 dark:text-red-400/80">
                {reason === 'peso'
                  ? `Alcanzaste el peso máximo de ${selectedBox.maxWeight} lbs. No puedes agregar más productos.`
                  : `No hay más espacio en la caja (${boxVol.toFixed(0)} in³). No puedes agregar más productos.`}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Separator />

      {/* Items list */}
      <ScrollArea className="flex-1" style={{ maxHeight: '180px' }}>
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center text-muted-foreground py-4"
            >
              <Package className="w-8 h-8 mb-2 opacity-20" />
              <p className="text-xs">Tu caja está vacía</p>
              <p className="text-[10px] mt-0.5">Agrega productos del catálogo</p>
            </motion.div>
          ) : (
            Object.values(grouped).map((group) => (
              <motion.div
                key={group.product.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 py-1.5 border-b last:border-0"
              >
                <span className="text-base">{group.product.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium truncate">
                    {group.product.nameEs}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {group.product.weight} lb · {group.product.volume} in³ × {group.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold">
                    ${(group.product.price * group.quantity).toFixed(2)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => removeProduct(group.ids[group.ids.length - 1])}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </ScrollArea>

      <Separator />

      {/* Cost breakdown */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">
            Productos ({items.length}):
          </span>
          <span className="font-medium">${pCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            Tax Walmart (7%):
          </span>
          <span className="font-medium">${wTax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Envío + Gestión:</span>
          <span className="font-medium">
            ${(selectedBox.price + selectedBox.managementFee).toFixed(2)}
          </span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm">TOTAL:</span>
          <motion.span
            className="font-black text-xl text-primary"
            key={tCost}
            initial={{ scale: 1.2 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            ${tCost.toFixed(2)}
          </motion.span>
        </div>
      </div>

      {/* CTA when box is full */}
      <AnimatePresence>
        {isFull && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completar Pedido — ${tCost.toFixed(2)}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-1">
              Tu caja está lista para ser enviada
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
