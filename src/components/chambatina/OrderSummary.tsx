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
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export default function OrderSummary() {
  const {
    selectedBox,
    items,
    currentWeight,
    productCost,
    totalCost,
    remainingWeight,
    weightPercentage,
    removeProduct,
    clearBox,
  } = useBoxFillerStore();

  const wp = weightPercentage();
  const isNearLimit = wp > 85;
  const isOverLimit = wp >= 100;
  const weight = currentWeight();
  const pCost = productCost();
  const tCost = totalCost();
  const remaining = remainingWeight();

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
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Resumen de la Caja
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
      <div className="bg-muted/50 rounded-lg p-2.5 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Caja:</span>
          <span className="font-semibold">
            {selectedBox.width}&quot; × {selectedBox.height}&quot; × {selectedBox.depth}&quot;
          </span>
        </div>
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
          <span className="font-medium">
            Peso: {weight.toFixed(1)} / {selectedBox.maxWeight} lbs
          </span>
          <span
            className={`font-bold ${
              isOverLimit
                ? 'text-destructive'
                : isNearLimit
                ? 'text-amber-500'
                : 'text-green-600'
            }`}
          >
            {remaining.toFixed(1)} lbs libres
          </span>
        </div>
        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full transition-colors ${
              isOverLimit
                ? 'bg-destructive'
                : isNearLimit
                ? 'bg-amber-500'
                : 'bg-green-500'
            }`}
            animate={{ width: `${Math.min(wp, 100)}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
        {isNearLimit && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-1 text-[10px] mt-1 text-amber-600"
          >
            <AlertTriangle className="w-3 h-3" />
            {isOverLimit
              ? '¡Capacidad máxima alcanzada!'
              : 'Acercándose al límite de peso'}
          </motion.div>
        )}
      </div>

      <Separator />

      {/* Items list */}
      <ScrollArea className="flex-1" style={{ maxHeight: '200px' }}>
        <AnimatePresence mode="popLayout">
          {items.length === 0 ? (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-center text-muted-foreground py-4"
            >
              <Package className="w-8 h-8 mx-auto mb-2 opacity-20" />
              Tu caja está vacía
            </motion.p>
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
                <span className="text-lg">{group.product.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {group.product.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {group.product.weight} lb × {group.quantity} ={' '}
                    {(group.product.weight * group.quantity).toFixed(1)} lbs
                  </p>
                </div>
                <div className="text-right">
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

      {/* Totals */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Productos ({items.length}):</span>
          <span className="font-medium">${pCost.toFixed(2)}</span>
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
    </Card>
  );
}
