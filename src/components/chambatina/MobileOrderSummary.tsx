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

export default function MobileOrderSummary() {
  const store = useBoxFillerStore();
  const { selectedBox, items } = store;
  const paymentState = store.paymentState;
  const processPayment = store.processPayment;
  const paymentOrderId = store.paymentOrderId;
  const setPaymentState = store.setPaymentState;

  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '' });
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  const wp = store.weightPercentage();
  const vp = store.volumePercentage();
  const isFull = store.boxFull();
  const reason = store.boxFullReason();
  const weight = store.currentWeight();
  const volume = store.currentVolume();
  const pCost = store.productCost();
  const wTax = store.walmartTax();
  const tCost = store.totalCost();
  const remW = store.remainingWeight();
  const remV = store.remainingVolume();
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
    store.clearBox();
    setPaymentState('idle');
    setCustomerInfo({ name: '', email: '', phone: '' });
    setShowPaymentForm(false);
  };

  const isFormValid = customerInfo.name.trim() !== '' && customerInfo.email.trim() !== '' && customerInfo.phone.trim() !== '';

  // ── Render ──

  return (
    <Card className="p-4 flex flex-col gap-3" style={{ touchAction: 'manipulation' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <ShoppingCart className="w-4 h-4" />
          Tu Pedido
        </h3>
        {items.length > 0 && paymentState !== 'success' && (
          <button
            className="h-7 text-xs text-red-500 font-medium"
            onClick={store.clearBox}
          >
            <Trash2 className="w-3 h-3 inline mr-1" />
            Vaciar
          </button>
        )}
      </div>

      {/* Box info */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 text-xs space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-500">Caja:</span>
          <span className="font-semibold">{selectedBox.width}&quot;×{selectedBox.height}&quot;×{selectedBox.depth}&quot;</span>
        </div>
        <div className="flex justify-between text-[10px] text-gray-500">
          <span>Volumen: {boxVol.toFixed(0)} in³</span>
          <span>Peso máx: {selectedBox.maxWeight} lbs</span>
        </div>
        <Separator className="my-1" />
        <div className="flex justify-between">
          <span className="text-gray-500">Envío:</span>
          <span className="font-semibold">${selectedBox.price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Gestión:</span>
          <span className="font-semibold">${selectedBox.managementFee.toFixed(2)}</span>
        </div>
      </div>

      {/* Weight bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium">Peso</span>
          <span className="font-bold" style={{ color: getBarColor(wp) }}>
            {weight.toFixed(1)} / {selectedBox.maxWeight} lbs
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: getBarColor(wp), width: `${Math.min(100, wp)}%` }} />
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">{remW.toFixed(1)} lbs disponibles</p>
      </div>

      {/* Volume bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="font-medium">Volumen</span>
          <span className="font-bold" style={{ color: getBarColor(vp) }}>
            {volume.toFixed(0)} / {boxVol.toFixed(0)} in³
          </span>
        </div>
        <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all duration-300" style={{ backgroundColor: getBarColor(vp), width: `${Math.min(100, vp)}%` }} />
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">{remV.toFixed(0)} in³ disponibles</p>
      </div>

      {/* Box full warning */}
      {isFull && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-2.5 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-red-600 mb-1">
            <Lock className="w-3.5 h-3.5" /> CAJA LLENA
          </div>
          <p className="text-red-500">
            {reason === 'peso'
              ? `Alcanzaste ${selectedBox.maxWeight} lbs.`
              : `No hay más espacio en la caja.`}
          </p>
        </div>
      )}

      <Separator />

      {/* Items list - plain div, NO ScrollArea */}
      <div style={{ maxHeight: '200px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center text-center text-gray-400 py-4">
            <Package className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">Tu caja está vacía</p>
            <p className="text-[10px] mt-0.5">Agrega productos del catálogo</p>
          </div>
        ) : (
          Object.values(grouped).map((group) => (
            <div key={group.product.id} className="flex items-center gap-2 py-1.5 border-b last:border-0">
              <span className="text-base">{group.product.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{group.product.nameEs}</p>
                <p className="text-[10px] text-gray-500">{group.product.weight} lb × {group.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-bold">${(group.product.price * group.quantity).toFixed(2)}</p>
              </div>
              {paymentState !== 'success' && (
                <button
                  className="h-6 w-6 p-0 text-red-500 shrink-0"
                  onClick={() => store.removeProduct(group.ids[group.ids.length - 1])}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      <Separator />

      {/* Cost breakdown */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Productos ({items.length}):</span>
          <span className="font-medium">${pCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Tax Walmart (7%):</span>
          <span className="font-medium">${wTax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-500">Envío + Gestión:</span>
          <span className="font-medium">${(selectedBox.price + selectedBox.managementFee).toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm">TOTAL:</span>
          <span className="font-black text-xl text-green-600">${tCost.toFixed(2)}</span>
        </div>
      </div>

      {/* ── PAYMENT SECTION ── */}
      {items.length > 0 && (
        <div className="space-y-3">
          {/* Idle: Show pay button */}
          {paymentState === 'idle' && !showPaymentForm && (
            <div>
              <button
                onClick={() => setShowPaymentForm(true)}
                className="w-full font-bold h-14 gap-2 text-white text-base rounded-xl flex items-center justify-center"
                style={{ backgroundColor: '#2CA01C', touchAction: 'manipulation' }}
              >
                <CreditCard className="w-5 h-5" />
                <Lock className="w-4 h-4" />
                Pagar ${tCost.toFixed(2)} con QuickBooks
              </button>
              <p className="text-[10px] text-center text-gray-500 mt-1">
                {isFull ? 'Caja llena — completa el pago' : 'Puedes seguir agregando o pagar ahora'}
              </p>
            </div>
          )}

          {/* Idle: Show inline payment form */}
          {paymentState === 'idle' && showPaymentForm && (
            <div className="bg-gray-50 dark:bg-gray-900/30 rounded-xl p-4 space-y-3 border">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2CA01C' }}>
                    <Lock className="w-3.5 h-3.5 text-white" />
                  </div>
                  Pago Seguro
                </h4>
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="text-xs text-gray-500 underline"
                  style={{ touchAction: 'manipulation' }}
                >
                  Cancelar
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 space-y-1 text-xs border">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total:</span>
                  <span className="font-bold text-base">${tCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Productos:</span>
                  <span>{items.length} items</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1">
                    <User className="w-3 h-3 inline mr-1" />
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    placeholder="Tu nombre completo"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full h-11 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                    style={{ touchAction: 'manipulation' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">
                    <Mail className="w-3 h-3 inline mr-1" />
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full h-11 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                    style={{ touchAction: 'manipulation' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">
                    <Phone className="w-3 h-3 inline mr-1" />
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full h-11 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                    style={{ touchAction: 'manipulation' }}
                  />
                </div>
              </div>

              {!isFormValid && (
                <p className="text-[11px] text-center text-amber-600 font-medium">
                  Completa todos los campos para pagar
                </p>
              )}

              <button
                onClick={handleProcessPayment}
                disabled={!isFormValid}
                className="w-full font-bold h-12 gap-2 text-white text-base rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: isFormValid ? '#2CA01C' : '#9ca3af', touchAction: 'manipulation' }}
              >
                <Lock className="w-4 h-4" />
                Confirmar Pago ${tCost.toFixed(2)}
              </button>

              <p className="text-[10px] text-center text-gray-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" />
                Pago seguro procesado por QuickBooks Payments
              </p>
            </div>
          )}

          {/* Processing */}
          {paymentState === 'processing' && (
            <div className="flex flex-col items-center gap-2 py-6">
              <Loader2 className="w-10 h-10 animate-spin" style={{ color: '#2CA01C' }} />
              <p className="text-sm font-semibold text-gray-500">Procesando pago...</p>
              <p className="text-[10px] text-gray-400">Conectando con QuickBooks Payments</p>
            </div>
          )}

          {/* Success */}
          {paymentState === 'success' && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
              <div>
                <p className="text-base font-bold text-green-700">Pago exitoso!</p>
                <p className="text-xs text-green-600 mt-1">
                  Orden: <span className="font-mono font-bold">{paymentOrderId}</span>
                </p>
              </div>
              <button
                onClick={handleNewOrder}
                className="w-full bg-green-600 text-white font-bold h-10 rounded-lg flex items-center justify-center gap-2"
                style={{ touchAction: 'manipulation' }}
              >
                <ShoppingCart className="w-4 h-4" />
                Nuevo Pedido
              </button>
            </div>
          )}

          {/* Error */}
          {paymentState === 'error' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center space-y-2">
              <XCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-sm font-bold text-red-600">Error al procesar el pago</p>
              <p className="text-xs text-red-400">Intenta de nuevo.</p>
              <button
                onClick={handleRetry}
                className="text-xs gap-1.5 border rounded-lg px-4 py-2 mx-auto flex items-center"
                style={{ touchAction: 'manipulation' }}
              >
                <RotateCcw className="w-3 h-3" />
                Reintentar pago
              </button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
