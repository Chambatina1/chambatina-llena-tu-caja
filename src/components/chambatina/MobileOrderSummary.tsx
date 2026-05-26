'use client';

import { useState } from 'react';
import { useBoxFillerStore } from '@/store/box-filler-store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
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
  Loader2,
  XCircle,
  RotateCcw,
  CreditCard,
  User,
  Mail,
  Phone,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

export default function MobileOrderSummary() {
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

  const paymentState = useBoxFillerStore((s) => s.paymentState);
  const processPayment = useBoxFillerStore((s) => s.processPayment);
  const paymentOrderId = useBoxFillerStore((s) => s.paymentOrderId);
  const setPaymentState = useBoxFillerStore((s) => s.setPaymentState);

  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);

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

  const handleProcessPayment = async () => {
    if (!customerInfo.name.trim() || !customerInfo.email.trim() || !customerInfo.phone.trim()) return;
    const success = await processPayment({
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
    });
    if (!success) {
      setShowPaymentForm(true);
    }
  };

  const handleRetry = () => {
    setPaymentState('idle');
    setShowPaymentForm(true);
  };

  const handleNewOrder = () => {
    clearBox();
    setPaymentState('idle');
    setCustomerInfo({ name: '', email: '', phone: '' });
    setShowPaymentForm(false);
  };

  const isFormValid = customerInfo.name.trim() !== '' && customerInfo.email.trim() !== '' && customerInfo.phone.trim() !== '';

  return (
    <Card className="p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Tu Pedido
        </h3>
        {items.length > 0 && paymentState !== 'success' && (
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
            animate={{ width: `${Math.min(100, wp)}%` }}
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
            animate={{ width: `${Math.min(100, vp)}%` }}
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
      <ScrollArea className="flex-1" style={{ maxHeight: '200px' }}>
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
                    {group.product.weight} lb × {group.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold">
                    ${(group.product.price * group.quantity).toFixed(2)}
                  </p>
                </div>
                {paymentState !== 'success' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => removeProduct(group.ids[group.ids.length - 1])}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
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

      {/* CTA — Show whenever there are items */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="space-y-3"
          >
            {/* Payment State: Idle - Show inline form */}
            {paymentState === 'idle' && !showPaymentForm && (
              <>
                {isFull && (
                  <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg px-3 py-1.5 text-center text-[10px] font-semibold text-green-700 dark:text-green-400">
                    Caja llena — lista para enviar
                  </div>
                )}
                <Button
                  onClick={() => setShowPaymentForm(true)}
                  className="w-full font-bold h-12 gap-2 text-white text-base"
                  style={{ backgroundColor: '#2CA01C' }}
                >
                  <CreditCard className="w-5 h-5" />
                  <Lock className="w-4 h-4" />
                  Pagar ${tCost.toFixed(2)} con QuickBooks
                </Button>
                <p className="text-[10px] text-center text-muted-foreground">
                  {isFull
                    ? 'Tu caja está lista — completa el pago para confirmar'
                    : 'Puedes seguir agregando productos o pagar ahora'}
                </p>
              </>
            )}

            {/* Payment State: Idle - Show inline payment form */}
            {paymentState === 'idle' && showPaymentForm && (
              <div className="bg-muted/30 rounded-xl p-4 space-y-3 border">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2CA01C' }}>
                      <Lock className="w-3.5 h-3.5 text-white" />
                    </div>
                    Pago Seguro
                  </h4>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="bg-white dark:bg-card rounded-lg p-2.5 space-y-1.5 text-xs border">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total:</span>
                    <span className="font-bold text-base">${tCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Caja:</span>
                    <span className="font-medium">{selectedBox.width}&quot;×{selectedBox.height}&quot;×{selectedBox.depth}&quot;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productos:</span>
                    <span className="font-medium">{items.length} items</span>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Tu nombre completo"
                      value={customerInfo.name}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Correo electrónico <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="tu@email.com"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="h-10 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Teléfono <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="h-10 text-sm"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleProcessPayment}
                  disabled={!isFormValid}
                  className="w-full font-bold h-12 gap-2 text-white text-base"
                  style={{ backgroundColor: isFormValid ? '#2CA01C' : undefined }}
                >
                  <CreditCard className="w-5 h-5" />
                  <Lock className="w-4 h-4" />
                  Confirmar Pago ${tCost.toFixed(2)}
                </Button>

                {!isFormValid && (
                  <p className="text-[10px] text-center text-amber-600">
                    Completa todos los campos para pagar
                  </p>
                )}

                <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Pago seguro procesado por QuickBooks Payments</span>
                </div>
              </div>
            )}

            {/* Payment State: Processing */}
            {paymentState === 'processing' && (
              <div className="flex flex-col items-center gap-2 py-6">
                <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#2CA01C' }} />
                <p className="text-sm font-semibold text-muted-foreground">
                  Procesando pago...
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Conectando con QuickBooks Payments
                </p>
              </div>
            )}

            {/* Payment State: Success */}
            {paymentState === 'success' && (
              <div className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
                <div>
                  <p className="text-base font-bold text-green-700 dark:text-green-400">
                    Pago exitoso!
                  </p>
                  <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1">
                    Orden: <span className="font-mono font-bold">{paymentOrderId}</span>
                  </p>
                </div>
                <Button
                  onClick={handleNewOrder}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10 gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Nuevo Pedido
                </Button>
              </div>
            )}

            {/* Payment State: Error */}
            {paymentState === 'error' && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center space-y-2">
                <XCircle className="w-8 h-8 text-red-500 mx-auto" />
                <p className="text-sm font-bold text-red-600 dark:text-red-400">
                  Error al procesar el pago
                </p>
                <p className="text-xs text-red-500/80 dark:text-red-400/80">
                  Hubo un problema con la transacción. Intenta de nuevo.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={handleRetry}
                >
                  <RotateCcw className="w-3 h-3" />
                  Reintentar pago
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
