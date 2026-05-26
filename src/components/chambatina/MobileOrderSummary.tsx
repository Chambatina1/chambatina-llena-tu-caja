'use client';

import { useState, useMemo } from 'react';
import { useBoxFillerStore } from '@/store/box-filler-store';

/* ── Helpers ── */

function detectCardType(num: string): 'visa' | 'mastercard' | 'amex' | 'discover' | null {
  const c = num.replace(/\s/g, '');
  if (/^4/.test(c)) return 'visa';
  if (/^5[1-5]/.test(c) || /^2[2-7]/.test(c)) return 'mastercard';
  if (/^3[47]/.test(c)) return 'amex';
  if (/^6(?:011|5)/.test(c)) return 'discover';
  return null;
}

function formatCardNumber(val: string): string {
  const c = val.replace(/\D/g, '').slice(0, 16);
  return c.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(val: string): string {
  const c = val.replace(/\D/g, '').slice(0, 4);
  if (c.length >= 3) return c.slice(0, 2) + '/' + c.slice(2);
  return c;
}

function luhnCheck(num: string): boolean {
  const c = num.replace(/\s/g, '');
  if (c.length < 13) return false;
  let sum = 0;
  let alt = false;
  for (let i = c.length - 1; i >= 0; i--) {
    let n = parseInt(c[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alt = !alt;
  }
  return sum % 10 === 0;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const CARD_ICONS: Record<string, { label: string; color: string; digits: number }> = {
  visa:      { label: 'VISA',      color: '#1a1f71', digits: 16 },
  mastercard: { label: 'MC',       color: '#eb001b', digits: 16 },
  amex:      { label: 'AMEX',     color: '#006fcf', digits: 15 },
  discover:  { label: 'DISC',     color: '#ff6000', digits: 16 },
};

/* ══════════════════════════════════════════════════════════════════════════ */

type CheckoutStep = 'cart' | 'info' | 'payment' | 'processing' | 'success' | 'error';

export default function MobileOrderSummary() {
  const store = useBoxFillerStore();
  const { selectedBox, items } = store;

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', phone: '', address: '' });
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [orderId, setOrderId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Computed
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

  // Card validation
  const cardType = useMemo(() => detectCardType(cardNumber), [cardNumber]);
  const rawCard = cardNumber.replace(/\s/g, '');
  const isCardValid = cardType ? (rawCard.length === CARD_ICONS[cardType].digits && luhnCheck(rawCard)) : false;
  const isExpiryValid = /^\d{2}\/\d{2}$/.test(cardExpiry) && (() => {
    const [m, y] = cardExpiry.split('/').map(Number);
    return m >= 1 && m <= 12 && y >= 25 && y <= 35;
  })();
  const cvvLen = cardType === 'amex' ? 4 : 3;
  const isCvvValid = cardCvv.length === cvvLen;
  const isInfoValid = customerInfo.name.trim() !== '' && isValidEmail(customerInfo.email) && customerInfo.phone.trim().length >= 7;
  const isPaymentValid = isCardValid && isExpiryValid && isCvvValid && cardName.trim() !== '';

  // Group items
  const grouped: Record<string, { product: typeof items[0]['product']; quantity: number; ids: string[] }> = {};
  items.forEach((item) => {
    if (grouped[item.product.id]) {
      grouped[item.product.id].quantity += 1;
      grouped[item.product.id].ids.push(item.id);
    } else {
      grouped[item.product.id] = { product: item.product, quantity: 1, ids: [item.id] };
    }
  });

  /* ── Handlers ── */

  const goToStep = (s: CheckoutStep) => {
    setStep(s);
    setErrorMsg('');
  };

  const handlePay = async () => {
    setStep('processing');
    try {
      const orderItems = items.map((item) => ({
        id: item.product.id, name: item.product.nameEs,
        quantity: item.quantity, price: item.product.price, weight: item.product.weight,
      }));

      const res = await fetch('/api/box-filler/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: tCost,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          boxSize: `${selectedBox.width}"x${selectedBox.height}"x${selectedBox.depth}"`,
          items: orderItems,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOrderId(data.orderId);
        setStep('success');
      } else {
        setErrorMsg(data.error || 'Error al procesar el pago');
        setStep('error');
      }
    } catch {
      setErrorMsg('Error de conexión. Intenta de nuevo.');
      setStep('error');
    }
  };

  const handleNewOrder = () => {
    store.clearBox();
    setStep('cart');
    setCustomerInfo({ name: '', email: '', phone: '', address: '' });
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setOrderId('');
    setErrorMsg('');
  };

  const inputCls = 'w-full h-12 px-3 text-sm rounded-lg border border-gray-300 bg-white outline-none';

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── STEP INDICATOR ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  const stepLabels = ['Carrito', 'Datos', 'Pago', 'Listo'];
  const stepIndex = step === 'cart' ? 0 : step === 'info' ? 1 : step === 'payment' ? 2 : step === 'processing' ? 3 : step === 'success' ? 3 : step === 'error' ? 2 : 0;

  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-3">
      {stepLabels.map((label, i) => (
        <div key={label} className="flex items-center flex-1">
          <div className="flex items-center gap-1.5 flex-1">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ backgroundColor: i < stepIndex ? '#16a34a' : i === stepIndex ? '#2563eb' : '#e5e7eb', color: i <= stepIndex ? '#fff' : '#9ca3af' }}>
              {i < stepIndex ? '\u2713' : i + 1}
            </div>
            <span className="text-[9px] font-semibold truncate" style={{ color: i <= stepIndex ? '#374151' : '#9ca3af' }}>
              {label}
            </span>
          </div>
          {i < stepLabels.length - 1 && (
            <div className="h-px flex-1 min-w-[8px] mx-1" style={{ backgroundColor: i < stepIndex ? '#16a34a' : '#e5e7eb' }} />
          )}
        </div>
      ))}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── CART VIEW ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'cart') {
    return (
      <div className="p-4 flex flex-col gap-3 border border-gray-200 rounded-xl bg-white" style={{ touchAction: 'manipulation' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2563eb' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </div>
            <span className="font-bold text-sm">Tu Pedido</span>
            {items.length > 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">{items.length}</span>}
          </div>
          {items.length > 0 && (
            <button onClick={store.clearBox} className="text-[11px] text-red-500 font-medium border-none bg-transparent cursor-pointer p-0" style={{ touchAction: 'manipulation' }}>Vaciar</button>
          )}
        </div>

        {/* Box info + bars */}
        <div className="bg-gray-50 rounded-lg p-2.5 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-gray-500">Caja:</span><span className="font-semibold">{selectedBox.width}&quot;x{selectedBox.height}&quot;x{selectedBox.depth}&quot;</span></div>
          <div className="flex justify-between text-[10px] text-gray-500"><span>Peso máx: {selectedBox.maxWeight} lbs</span><span>Vol: {boxVol.toFixed(0)} in³</span></div>
        </div>

        <div>
          <div className="flex justify-between text-[10px] mb-0.5"><span className="text-gray-500">Peso</span><span className="font-bold" style={{ color: getBarColor(wp) }}>{weight.toFixed(1)}/{selectedBox.maxWeight} lbs</span></div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ backgroundColor: getBarColor(wp), width: `${Math.min(100, wp)}%` }} /></div>
        </div>
        <div>
          <div className="flex justify-between text-[10px] mb-0.5"><span className="text-gray-500">Volumen</span><span className="font-bold" style={{ color: getBarColor(vp) }}>{volume.toFixed(0)}/{boxVol.toFixed(0)} in³</span></div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ backgroundColor: getBarColor(vp), width: `${Math.min(100, vp)}%` }} /></div>
        </div>

        {isFull && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-2.5 py-1.5 text-[11px] text-red-600 font-bold text-center">
            {reason === 'peso' ? 'Peso máximo alcanzado' : 'Volumen máximo alcanzado'}
          </div>
        )}

        {/* Items */}
        <div style={{ maxHeight: '180px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {items.length === 0 ? (
            <div className="text-center py-4 text-gray-400 text-xs">Tu caja está vacía</div>
          ) : Object.values(grouped).map((g) => (
            <div key={g.product.id} className="flex items-center gap-2 py-1" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <span className="text-base">{g.product.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{g.product.nameEs}</p>
                <p className="text-[10px] text-gray-400">{g.product.weight}lb x{g.quantity}</p>
              </div>
              <span className="text-xs font-bold">${(g.product.price * g.quantity).toFixed(2)}</span>
              <button onClick={() => store.removeProduct(g.ids[g.ids.length - 1])} className="w-5 h-5 flex items-center justify-center text-red-400 border-none bg-transparent cursor-pointer" style={{ touchAction: 'manipulation' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Total + Checkout button */}
        {items.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] text-gray-500"><span>Productos ({items.length}):</span><span>${pCost.toFixed(2)}</span></div>
            <div className="flex justify-between text-[10px] text-gray-500"><span>Tax Walmart (7%):</span><span>${wTax.toFixed(2)}</span></div>
            <div className="flex justify-between text-[10px] text-gray-500"><span>Envío + Gestión:</span><span>${(selectedBox.price + selectedBox.managementFee).toFixed(2)}</span></div>
            <div className="flex justify-between items-center pt-1" style={{ borderTop: '2px solid #e5e7eb' }}>
              <span className="font-bold text-sm">TOTAL:</span>
              <span className="font-black text-xl" style={{ color: '#16a34a' }}>${tCost.toFixed(2)}</span>
            </div>
            <button
              onClick={() => goToStep('info')}
              className="w-full font-bold h-13 text-white text-base rounded-xl flex items-center justify-center gap-2 border-none cursor-pointer"
              style={{ backgroundColor: '#2563eb', touchAction: 'manipulation', height: 52 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
              Ir a Pagar · ${tCost.toFixed(2)}
            </button>
            {!isFull && <p className="text-[9px] text-center text-gray-400">Puedes seguir agregando productos</p>}
          </div>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── CUSTOMER INFO STEP ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'info') {
    return (
      <div className="p-4 flex flex-col gap-3 border border-gray-200 rounded-xl bg-white" style={{ touchAction: 'manipulation' }}>
        <StepIndicator />

        <h3 className="font-bold text-sm text-center">Datos de Envío</h3>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Nombre completo *</label>
            <input type="text" placeholder="Como aparece en tu tarjeta" value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className={inputCls} style={{ touchAction: 'manipulation' }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Correo electrónico *</label>
            <input type="email" placeholder="tu@email.com" value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              className={inputCls} style={{ touchAction: 'manipulation' }} />
            {customerInfo.email && !isValidEmail(customerInfo.email) && <p className="text-[10px] text-red-500 mt-0.5">Correo no válido</p>}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Teléfono *</label>
            <input type="tel" placeholder="+1 (555) 123-4567" value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              className={inputCls} style={{ touchAction: 'manipulation' }} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Dirección de entrega</label>
            <input type="text" placeholder="Dirección completa (opcional)" value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              className={inputCls} style={{ touchAction: 'manipulation' }} />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => goToStep('cart')}
            className="flex-1 h-11 rounded-lg text-sm font-semibold border border-gray-300 bg-white cursor-pointer"
            style={{ touchAction: 'manipulation' }}>
            Volver
          </button>
          <button onClick={() => isInfoValid && goToStep('payment')}
            className="flex-1 h-11 rounded-lg text-sm font-bold text-white border-none cursor-pointer"
            style={{ backgroundColor: isInfoValid ? '#2563eb' : '#9ca3af', touchAction: 'manipulation', opacity: isInfoValid ? 1 : 0.5 }}>
            Continuar
          </button>
        </div>
        {!isInfoValid && <p className="text-[10px] text-center text-amber-600 font-medium">Completa los campos obligatorios</p>}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── PAYMENT (CARD) STEP ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'payment') {
    const last4 = rawCard.slice(-4);
    return (
      <div className="p-4 flex flex-col gap-3 border border-gray-200 rounded-xl bg-white" style={{ touchAction: 'manipulation' }}>
        <StepIndicator />

        <h3 className="font-bold text-sm text-center">Método de Pago</h3>

        {/* Card brand badge */}
        {cardType && (
          <div className="flex justify-center">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200" style={{ backgroundColor: CARD_ICONS[cardType].color + '10' }}>
              <div className="w-8 h-5 rounded" style={{ backgroundColor: CARD_ICONS[cardType].color }} />
              <span className="text-xs font-bold" style={{ color: CARD_ICONS[cardType].color }}>{CARD_ICONS[cardType].label}</span>
              {last4.length >= 4 && <span className="text-xs text-gray-400">****{last4}</span>}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {/* Card Number */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Número de tarjeta *</label>
            <div className="relative">
              <input type="tel" inputMode="numeric" placeholder="1234 5678 9012 3456" value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16)))}
                className={inputCls + ' pr-16'} style={{ touchAction: 'manipulation', letterSpacing: '1px' }} />
              {cardType && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black px-2 py-0.5 rounded"
                  style={{ backgroundColor: CARD_ICONS[cardType].color, color: '#fff' }}>
                  {CARD_ICONS[cardType].label}
                </div>
              )}
            </div>
            {rawCard.length > 0 && !cardType && <p className="text-[10px] text-red-500 mt-0.5">Tarjeta no reconocida</p>}
            {rawCard.length > 0 && cardType && rawCard.length < CARD_ICONS[cardType].digits && (
              <p className="text-[10px] text-gray-400 mt-0.5">Faltan {CARD_ICONS[cardType].digits - rawCard.length} dígitos</p>
            )}
            {isCardValid && <p className="text-[10px] text-green-600 mt-0.5 font-medium">Tarjeta válida</p>}
          </div>

          {/* Expiry + CVV row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Expiración *</label>
              <input type="tel" inputMode="numeric" placeholder="MM/AA" value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                className={inputCls} style={{ touchAction: 'manipulation' }} />
              {isExpiryValid && <p className="text-[10px] text-green-600 mt-0.5 font-medium">Válida</p>}
              {!isExpiryValid && cardExpiry.length === 5 && <p className="text-[10px] text-red-500 mt-0.5">Fecha inválida</p>}
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">CVV *</label>
              <input type="password" inputMode="numeric" placeholder={cardType === 'amex' ? '1234' : '123'}
                value={cardCvv} maxLength={cardType === 'amex' ? 4 : 3}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, cvvLen))}
                className={inputCls} style={{ touchAction: 'manipulation' }} />
              {isCvvValid && <p className="text-[10px] text-green-600 mt-0.5 font-medium">OK</p>}
            </div>
          </div>

          {/* Name on card */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Nombre en la tarjeta *</label>
            <input type="text" placeholder="Como aparece en la tarjeta" value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              className={inputCls} style={{ touchAction: 'manipulation', textTransform: 'uppercase' }} />
          </div>
        </div>

        {/* Order summary */}
        <div className="rounded-lg border border-gray-200 p-2.5 space-y-1 text-[11px]">
          <div className="flex justify-between font-semibold"><span>Total a pagar:</span><span className="text-base" style={{ color: '#16a34a' }}>${tCost.toFixed(2)}</span></div>
          <div className="text-gray-400">{items.length} productos · {customerInfo.name}</div>
        </div>

        <div className="flex gap-2 pt-1">
          <button onClick={() => goToStep('info')}
            className="flex-1 h-11 rounded-lg text-sm font-semibold border border-gray-300 bg-white cursor-pointer"
            style={{ touchAction: 'manipulation' }}>Volver</button>
          <button onClick={handlePay}
            className="flex-1 h-11 rounded-lg text-sm font-bold text-white border-none cursor-pointer flex items-center justify-center gap-2"
            style={{ backgroundColor: isPaymentValid ? '#16a34a' : '#9ca3af', touchAction: 'manipulation', opacity: isPaymentValid ? 1 : 0.5 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Pagar ${tCost.toFixed(2)}
          </button>
        </div>
        {!isPaymentValid && <p className="text-[10px] text-center text-amber-600 font-medium">Completa todos los campos de la tarjeta</p>}

        <div className="flex items-center justify-center gap-2 pt-1">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span className="text-[9px] text-gray-400">Pago seguro y encriptado · QuickBooks Payments</span>
        </div>

        {/* Accepted cards */}
        <div className="flex justify-center gap-3 pt-1">
          {['visa', 'mastercard', 'amex', 'discover'].map((t) => (
            <div key={t} className="px-2 py-1 rounded border border-gray-200 text-[8px] font-bold"
              style={{ backgroundColor: cardType === t ? CARD_ICONS[t].color + '15' : '#f9fafb', color: cardType === t ? CARD_ICONS[t].color : '#9ca3af' }}>
              {CARD_ICONS[t].label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── PROCESSING ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'processing') {
    return (
      <div className="p-6 flex flex-col items-center gap-4 border border-gray-200 rounded-xl bg-white" style={{ touchAction: 'manipulation' }}>
        <StepIndicator />
        <div className="w-14 h-14 border-4 rounded-full animate-spin" style={{ borderColor: '#e5e7eb', borderTopColor: '#2563eb' }} />
        <div className="text-center">
          <p className="font-bold text-sm text-gray-700">Procesando tu pago...</p>
          <p className="text-[11px] text-gray-400 mt-1">Verificando tarjeta · No cierres esta página</p>
        </div>
        <div className="space-y-1.5 text-[10px] text-gray-400 text-center">
          <p className="flex items-center gap-1 justify-center"><span style={{ color: '#16a34a' }}>{'\u2713'}</span> Conexión segura establecida</p>
          <p className="flex items-center gap-1 justify-center"><span style={{ color: '#16a34a' }}>{'\u2713'}</span> Datos de tarjeta enviados</p>
          <p className="flex items-center gap-1 justify-center"><span style={{ color: '#f59e0b' }}>{'\u25CF'}</span> Esperando autorización del banco...</p>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── SUCCESS (RECEIPT) ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'success') {
    const now = new Date();
    return (
      <div className="p-4 flex flex-col gap-3 border border-green-200 rounded-xl bg-green-50" style={{ touchAction: 'manipulation' }}>
        <StepIndicator />

        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#16a34a' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
        </div>

        <div className="text-center">
          <p className="font-bold text-lg" style={{ color: '#16a34a' }}>Compra Exitosa</p>
          <p className="text-xs text-gray-500 mt-0.5">Tu pedido ha sido confirmado</p>
        </div>

        {/* Receipt */}
        <div className="bg-white rounded-lg border border-green-200 p-3 space-y-2">
          {/* Receipt header */}
          <div className="text-center border-b border-dashed border-gray-300 pb-2">
            <p className="font-bold text-xs">CHAMBATINA — WALMART A TU FAMILIA</p>
            <p className="text-[10px] text-gray-400">Recibo de Compra</p>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-gray-500">Orden:</span><span className="font-mono font-bold">{orderId}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Fecha:</span><span>{now.toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cliente:</span><span className="font-medium">{customerInfo.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Email:</span><span>{customerInfo.email}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Teléfono:</span><span>{customerInfo.phone}</span></div>
            {customerInfo.address && <div className="flex justify-between"><span className="text-gray-500">Dirección:</span><span className="text-right max-w-[60%]">{customerInfo.address}</span></div>}
          </div>

          <div className="border-t border-dashed border-gray-300 pt-2">
            <div className="flex justify-between"><span className="text-gray-500">Caja:</span><span>{selectedBox.width}&quot;x{selectedBox.height}&quot;x{selectedBox.depth}&quot;</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Productos ({items.length}):</span><span>${pCost.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Tax Walmart (7%):</span><span>${wTax.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Envío:</span><span>${selectedBox.price.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Gestión:</span><span>${selectedBox.managementFee.toFixed(2)}</span></div>
          </div>

          {/* Items list */}
          <div className="border-t border-dashed border-gray-300 pt-2 space-y-0.5">
            {Object.values(grouped).map((g) => (
              <div key={g.product.id} className="flex justify-between text-[10px]">
                <span>{g.product.emoji} {g.product.nameEs} x{g.quantity}</span>
                <span>${(g.product.price * g.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-800 pt-2 flex justify-between items-center">
            <span className="font-bold text-sm">TOTAL:</span>
            <span className="font-black text-xl" style={{ color: '#16a34a' }}>${tCost.toFixed(2)}</span>
          </div>

          {/* Card info */}
          <div className="border-t border-dashed border-gray-300 pt-2 text-[10px] text-gray-500 space-y-0.5">
            <div className="flex justify-between">
              <span>Tarjeta:</span>
              <span>{cardType ? CARD_ICONS[cardType].label : 'N/A'} ****{rawCard.slice(-4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Estado:</span>
              <span className="font-bold" style={{ color: '#16a34a' }}>PAGADO</span>
            </div>
          </div>
        </div>

        {/* Peso info */}
        <div className="text-center text-[10px] text-gray-500 bg-white rounded-lg p-2 border border-green-200">
          <p className="font-semibold text-gray-700">Tu pedido viaja por mar hasta Nicaragua</p>
          <p className="mt-0.5">Peso total: {weight.toFixed(1)} lbs · {volume.toFixed(0)} in³</p>
        </div>

        <button onClick={handleNewOrder}
          className="w-full h-11 rounded-lg text-sm font-bold text-white border-none cursor-pointer"
          style={{ backgroundColor: '#2563eb', touchAction: 'manipulation' }}>
          Nuevo Pedido
        </button>

        <p className="text-[9px] text-center text-gray-400">Recibirás un correo de confirmación a {customerInfo.email}</p>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── ERROR ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'error') {
    return (
      <div className="p-4 flex flex-col gap-3 border border-red-200 rounded-xl bg-red-50 text-center" style={{ touchAction: 'manipulation' }}>
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
        </div>
        <div>
          <p className="font-bold text-sm text-red-700">Pago Rechazado</p>
          <p className="text-xs text-red-500 mt-1">{errorMsg || 'Tu tarjeta fue rechazada. Verifica los datos e intenta de nuevo.'}</p>
        </div>
        <button onClick={() => goToStep('payment')}
          className="w-full h-11 rounded-lg text-sm font-bold text-white border-none cursor-pointer"
          style={{ backgroundColor: '#2563eb', touchAction: 'manipulation' }}>
          Reintentar Pago
        </button>
        <button onClick={() => goToStep('cart')}
          className="w-full h-9 rounded-lg text-xs font-medium text-gray-500 border border-gray-300 bg-white cursor-pointer"
          style={{ touchAction: 'manipulation' }}>
          Volver al Carrito
        </button>
      </div>
    );
  }

  return null;
}
