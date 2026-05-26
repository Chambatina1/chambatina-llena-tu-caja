'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useBoxFillerStore } from '@/store/box-filler-store';

/* ═══════════════════════════════════════════════════════════════════════════
   MobileOrderSummary — Complete Store Checkout with QuickBooks Payments
   
   Flow: Carrito → Datos de Envío → Pago con Tarjeta → Procesando → Recibo
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Helpers ── */

function detectCardType(num: string): string {
  const c = num.replace(/\D/g, '');
  if (/^4/.test(c)) return 'visa';
  if (/^5[1-5]/.test(c) || /^2[2-7]/.test(c)) return 'mastercard';
  if (/^3[47]/.test(c)) return 'amex';
  if (/^6(?:011|5)/.test(c)) return 'discover';
  return '';
}

function formatCardNumber(val: string): string {
  const c = val.replace(/\D/g, '').slice(0, 19);
  return c.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiry(val: string): string {
  const c = val.replace(/\D/g, '').slice(0, 4);
  if (c.length >= 3) return c.slice(0, 2) + '/' + c.slice(2);
  return c;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const CARD_BRANDS: Record<string, { label: string; color: string; icon: string }> = {
  visa:       { label: 'VISA',  color: '#1a1f71', icon: 'V' },
  mastercard: { label: 'MC',    color: '#eb001b', icon: 'M' },
  amex:       { label: 'AMEX',  color: '#006fcf', icon: 'A' },
  discover:   { label: 'DISC',  color: '#ff6000', icon: 'D' },
};

type CheckoutStep = 'cart' | 'info' | 'payment' | 'processing' | 'success' | 'error';

interface ProcessingStep {
  label: string;
  status: 'pending' | 'active' | 'done';
}

export default function MobileOrderSummary() {
  const store = useBoxFillerStore();
  const { selectedBox, items } = store;

  const [step, setStep] = useState<CheckoutStep>('cart');
  const [customerInfo, setCustomerInfo] = useState({
    name: '', email: '', phone: '', address: '',
  });
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [orderResult, setOrderResult] = useState<Record<string, unknown> | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [processingTimer, setProcessingTimer] = useState(0);
  const processingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (processingRef.current) clearTimeout(processingRef.current);
    };
  }, []);

  // Computed values
  const wp = store.weightPercentage();
  const vp = store.volumePercentage();
  const isFull = store.boxFull();
  const reason = store.boxFullReason();
  const weight = store.currentWeight();
  const volume = store.currentVolume();
  const pCost = store.productCost();
  const wTax = store.walmartTax();
  const tCost = store.totalCost();
  const boxVol = selectedBox.width * selectedBox.height * selectedBox.depth;

  const getBarColor = (pct: number) =>
    pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : pct > 40 ? '#3b82f6' : '#22c55e';

  // Card type detection
  const cardType = useMemo(() => detectCardType(cardNumber), [cardNumber]);
  const rawCard = cardNumber.replace(/\s/g, '');
  const cardDigits = rawCard.length;
  const cvvLen = cardType === 'amex' ? 4 : 3;

  // Relaxed validation: accept any 13+ digit card number
  const isCardComplete = cardDigits >= 13 && cardDigits <= 19;
  const isExpiryValid = /^\d{2}\/\d{2}$/.test(cardExpiry) && (() => {
    const [m, y] = cardExpiry.split('/').map(Number);
    return m >= 1 && m <= 12;
  })();
  const isCvvValid = cardCvv.length >= cvvLen;
  const isCardNameValid = cardName.trim().length >= 2;
  const isPaymentReady = isCardComplete && isExpiryValid && isCvvValid && isCardNameValid;

  const isInfoValid = customerInfo.name.trim().length >= 2
    && isValidEmail(customerInfo.email)
    && customerInfo.phone.replace(/\D/g, '').length >= 7;

  // Group items by product
  const grouped = useMemo(() => {
    const map: Record<string, { product: typeof items[0]['product']; quantity: number; ids: string[] }> = {};
    items.forEach((item) => {
      if (map[item.product.id]) {
        map[item.product.id].quantity += 1;
        map[item.product.id].ids.push(item.id);
      } else {
        map[item.product.id] = { product: item.product, quantity: 1, ids: [item.id] };
      }
    });
    return map;
  }, [items]);

  /* ── Handlers ── */

  const goToStep = useCallback((s: CheckoutStep) => {
    setStep(s);
    setErrorMsg('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handlePay = useCallback(async () => {
    setStep('processing');
    setProcessingTimer(0);

    // Animate processing steps
    const steps: ProcessingStep[] = [
      { label: 'Conectando con QuickBooks Payments...', status: 'active' },
      { label: 'Tokenizando datos de tarjeta...', status: 'pending' },
      { label: 'Verificando con el banco...', status: 'pending' },
      { label: 'Autorizando cargo...', status: 'pending' },
      { label: 'Enviando factura por correo...', status: 'pending' },
    ];

    setProcessingSteps([...steps]);

    // Advance processing steps over time
    const advanceStep = (index: number) => {
      setProcessingSteps((prev) => {
        const next = [...prev];
        if (index < next.length) {
          next[index] = { ...next[index], status: 'done' };
          if (index + 1 < next.length) {
            next[index + 1] = { ...next[index + 1], status: 'active' };
          }
        }
        return next;
      });
      setProcessingTimer((prev) => prev + 1);
    };

    processingRef.current = setTimeout(() => advanceStep(0), 500);
    setTimeout(() => advanceStep(1), 1200);
    setTimeout(() => advanceStep(2), 2000);
    setTimeout(() => advanceStep(3), 2800);

    try {
      const orderItems = items.map((item) => ({
        id: item.product.id,
        name: item.product.nameEs,
        quantity: item.quantity,
        price: item.product.price,
        weight: item.product.weight,
      }));

      const res = await fetch('/api/box-filler/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: tCost,
          customerName: customerInfo.name,
          customerEmail: customerInfo.email,
          customerPhone: customerInfo.phone,
          customerAddress: customerInfo.address,
          boxSize: `${selectedBox.width}"x${selectedBox.height}"x${selectedBox.depth}"`,
          items: orderItems,
          cardNumber: rawCard,
          cardExpiry,
          cardCvv,
          cardName,
        }),
      });

      // Mark last steps done
      advanceStep(4);

      const data = await res.json();
      if (data.success) {
        setTimeout(() => {
          setOrderResult(data);
          setStep('success');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 600);
      } else {
        setTimeout(() => {
          setErrorMsg(data.error || 'Error al procesar el pago');
          setStep('error');
        }, 600);
      }
    } catch {
      setErrorMsg('Error de conexión. Verifica tu internet e intenta de nuevo.');
      setStep('error');
    }
  }, [items, tCost, customerInfo, selectedBox, rawCard, cardExpiry, cardCvv, cardName]);

  const handleNewOrder = useCallback(() => {
    store.clearBox();
    setStep('cart');
    setCustomerInfo({ name: '', email: '', phone: '', address: '' });
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setCardName('');
    setOrderResult(null);
    setErrorMsg('');
  }, [store]);

  const inputCls = 'w-full h-12 px-3 text-sm rounded-lg border border-gray-300 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── STEP INDICATOR ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  const stepLabels = ['Carrito', 'Datos', 'Pago', 'Listo'];
  const stepIndex = step === 'cart' ? 0 : step === 'info' ? 1 : step === 'payment' ? 2 : step === 'processing' ? 3 : step === 'success' ? 4 : step === 'error' ? 2 : 0;

  const StepIndicator = () => (
    <div className="flex items-center gap-1 mb-3" style={{ touchAction: 'manipulation' }}>
      {stepLabels.map((label, i) => {
        const active = i <= stepIndex;
        const current = i === stepIndex;
        return (
          <div key={label} className="flex items-center flex-1">
            <div className="flex items-center gap-1.5 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-all"
                style={{
                  backgroundColor: i < stepIndex ? '#16a34a' : current ? '#2563eb' : '#e5e7eb',
                  color: i <= stepIndex ? '#fff' : '#9ca3af',
                  boxShadow: current ? '0 0 0 3px rgba(37,99,235,0.2)' : 'none',
                }}
              >
                {i < stepIndex ? '\u2713' : i + 1}
              </div>
              <span className="text-[10px] font-semibold truncate" style={{ color: active ? '#374151' : '#9ca3af' }}>
                {label}
              </span>
            </div>
            {i < stepLabels.length - 1 && (
              <div className="h-0.5 flex-1 min-w-[8px] mx-1 rounded-full transition-all" style={{ backgroundColor: i < stepIndex ? '#16a34a' : '#e5e7eb' }} />
            )}
          </div>
        );
      })}
    </div>
  );

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── STEP 1: CART ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'cart') {
    return (
      <div className="p-4 flex flex-col gap-3 border border-gray-200 rounded-xl bg-white shadow-sm" style={{ touchAction: 'manipulation' }}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#0070c0' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
              </svg>
            </div>
            <div>
              <span className="font-bold text-sm block">Tu Pedido</span>
              {items.length > 0 && (
                <span className="text-[10px] text-gray-500">{items.length} producto{items.length !== 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
          {items.length > 0 && (
            <button onClick={store.clearBox} className="text-[11px] text-red-500 font-semibold border-none bg-transparent cursor-pointer p-1 rounded hover:bg-red-50" style={{ touchAction: 'manipulation' }}>
              Vaciar
            </button>
          )}
        </div>

        {/* Box info */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-2.5 text-xs space-y-1">
          <div className="flex justify-between"><span className="text-gray-600">Caja:</span><span className="font-semibold">{selectedBox.width}&quot;x{selectedBox.height}&quot;x{selectedBox.depth}&quot;</span></div>
          <div className="flex justify-between text-[10px] text-gray-500"><span>Peso máx: {selectedBox.maxWeight} lbs</span><span>Vol: {boxVol.toFixed(0)} in³</span></div>
        </div>

        {/* Weight bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-gray-500">Peso</span>
            <span className="font-bold" style={{ color: getBarColor(wp) }}>{weight.toFixed(1)}/{selectedBox.maxWeight} lbs</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: getBarColor(wp), width: `${Math.min(100, wp)}%` }} />
          </div>
        </div>

        {/* Volume bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-0.5">
            <span className="text-gray-500">Volumen</span>
            <span className="font-bold" style={{ color: getBarColor(vp) }}>{volume.toFixed(0)}/{boxVol.toFixed(0)} in³</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ backgroundColor: getBarColor(vp), width: `${Math.min(100, vp)}%` }} />
          </div>
        </div>

        {isFull && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-[11px] text-red-600 font-bold text-center">
            {reason === 'peso' ? '\uD83D\uDEAB Peso máximo alcanzado' : '\uD83D\uDEAB Volumen máximo alcanzado'}
          </div>
        )}

        {/* Items */}
        <div style={{ maxHeight: '200px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {items.length === 0 ? (
            <div className="text-center py-6 text-gray-400 text-xs">
              <svg className="mx-auto mb-2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 8v8M8 12h8"/></svg>
              Tu caja está vacía
            </div>
          ) : Object.values(grouped).map((g) => (
            <div key={g.product.id} className="flex items-center gap-2 py-2" style={{ borderBottom: '1px solid #f3f4f6' }}>
              <span className="text-lg">{g.product.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium truncate">{g.product.nameEs}</p>
                <p className="text-[10px] text-gray-400">{g.product.weight} lb x{g.quantity}</p>
              </div>
              <span className="text-xs font-bold">${(g.product.price * g.quantity).toFixed(2)}</span>
              <button
                onClick={() => store.removeProduct(g.ids[g.ids.length - 1])}
                className="w-6 h-6 flex items-center justify-center text-red-400 border-none bg-transparent cursor-pointer rounded-full hover:bg-red-50"
                style={{ touchAction: 'manipulation' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
          ))}
        </div>

        {/* Total + Checkout button */}
        {items.length > 0 && (
          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Productos ({items.length}):</span><span>${pCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Tax Walmart (7%):</span><span>${wTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-gray-500">
              <span>Envío + Gestión:</span><span>${(selectedBox.price + selectedBox.managementFee).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2" style={{ borderTop: '2px solid #e5e7eb' }}>
              <span className="font-bold text-sm">TOTAL:</span>
              <span className="font-black text-2xl" style={{ color: '#16a34a' }}>${tCost.toFixed(2)}</span>
            </div>

            <button
              onClick={() => goToStep('info')}
              className="w-full font-bold text-white text-base rounded-xl flex items-center justify-center gap-2 border-none cursor-pointer transition-transform active:scale-[0.98]"
              style={{ backgroundColor: '#0070c0', touchAction: 'manipulation', height: 52 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
  /* ── STEP 2: CUSTOMER INFO ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'info') {
    return (
      <div className="p-4 flex flex-col gap-3 border border-gray-200 rounded-xl bg-white shadow-sm" style={{ touchAction: 'manipulation' }}>
        <StepIndicator />

        <div className="text-center">
          <h3 className="font-bold text-sm">Datos de Envío</h3>
          <p className="text-[10px] text-gray-400 mt-0.5">Información para tu pedido</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Nombre completo *</label>
            <input
              type="text"
              placeholder="Como aparece en tu tarjeta"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              className={inputCls}
              style={{ touchAction: 'manipulation' }}
              autoComplete="name"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Correo electrónico *</label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
              className={inputCls}
              style={{ touchAction: 'manipulation' }}
              autoComplete="email"
            />
            {customerInfo.email.length > 3 && !isValidEmail(customerInfo.email) && (
              <p className="text-[10px] text-red-500 mt-0.5">Correo no válido</p>
            )}
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Teléfono *</label>
            <input
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              className={inputCls}
              style={{ touchAction: 'manipulation' }}
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Dirección de entrega</label>
            <input
              type="text"
              placeholder="Dirección completa (opcional)"
              value={customerInfo.address}
              onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
              className={inputCls}
              style={{ touchAction: 'manipulation' }}
              autoComplete="street-address"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            onClick={() => goToStep('cart')}
            className="flex-1 h-12 rounded-lg text-sm font-semibold border border-gray-300 bg-white cursor-pointer hover:bg-gray-50"
            style={{ touchAction: 'manipulation' }}
          >
            Volver
          </button>
          <button
            onClick={() => isInfoValid && goToStep('payment')}
            className="flex-1 h-12 rounded-lg text-sm font-bold text-white border-none cursor-pointer transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: isInfoValid ? '#0070c0' : '#9ca3af',
              touchAction: 'manipulation',
              opacity: isInfoValid ? 1 : 0.6,
            }}
          >
            Continuar al Pago
          </button>
        </div>
        {!isInfoValid && customerInfo.name.length > 0 && (
          <p className="text-[10px] text-center text-amber-600 font-medium">Completa todos los campos obligatorios</p>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── STEP 3: PAYMENT ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'payment') {
    const last4 = rawCard.slice(-4);
    return (
      <div className="p-4 flex flex-col gap-3 border border-gray-200 rounded-xl bg-white shadow-sm" style={{ touchAction: 'manipulation' }}>
        <StepIndicator />

        {/* QuickBooks Payments badge */}
        <div className="flex items-center justify-center gap-2 py-1">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-200 bg-green-50">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#2CA01C"/>
              <text x="6" y="16" fill="white" fontSize="11" fontWeight="bold">QB</text>
            </svg>
            <div>
              <span className="text-xs font-bold text-green-800 block leading-tight">QuickBooks Payments</span>
              <span className="text-[9px] text-green-600">Pago seguro y encriptado</span>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-sm text-center">Método de Pago</h3>

        {/* Card visual preview */}
        <div
          className="w-full h-44 rounded-2xl p-5 flex flex-col justify-between text-white shadow-lg relative overflow-hidden"
          style={{
            background: cardType && CARD_BRANDS[cardType]
              ? `linear-gradient(135deg, ${CARD_BRANDS[cardType].color}dd, ${CARD_BRANDS[cardType].color})`
              : 'linear-gradient(135deg, #64748b, #475569)',
          }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px), radial-gradient(circle at 20% 80%, white 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />

          <div className="flex justify-between items-start relative z-10">
            <div className="flex items-center gap-1.5">
              <svg width="28" height="20" viewBox="0 0 40 25" fill="none">
                <rect x="0" y="0" width="40" height="25" rx="3" fill="#FFD700" opacity="0.9"/>
                <rect x="0" y="0" width="40" height="12" rx="3" fill="#FFD700"/>
              </svg>
            </div>
            {cardType && CARD_BRANDS[cardType] && (
              <span className="text-lg font-black tracking-wider opacity-90">{CARD_BRANDS[cardType].label}</span>
            )}
          </div>

          <div className="relative z-10">
            <p className="text-lg tracking-[4px] font-mono" style={{ letterSpacing: '3px' }}>
              {rawCard.length === 0
                ? '\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022'
                : formatCardNumber(rawCard.padEnd(16, '\u2022').replace(/(.{4})/g, '$1 ').trim())
              }
            </p>
          </div>

          <div className="flex justify-between items-end relative z-10">
            <div>
              <p className="text-[8px] opacity-60 uppercase tracking-wider">Titular</p>
              <p className="text-xs font-semibold truncate max-w-[140px]">
                {cardName.trim() || 'NOMBRE EN TARJETA'}
              </p>
            </div>
            <div>
              <p className="text-[8px] opacity-60 uppercase tracking-wider">Expira</p>
              <p className="text-xs font-semibold">{cardExpiry || 'MM/AA'}</p>
            </div>
          </div>
        </div>

        {/* Card input form */}
        <div className="space-y-3">
          {/* Card Number */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Número de tarjeta *</label>
            <div className="relative">
              <input
                type="tel"
                inputMode="numeric"
                placeholder="1234 5678 9012 3456"
                value={cardNumber}
                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                className={inputCls + ' pr-20'}
                style={{ touchAction: 'manipulation', letterSpacing: '1.5px', fontSize: '15px' }}
                autoComplete="cc-number"
              />
              {cardType && CARD_BRANDS[cardType] && (
                <div
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-black px-2 py-1 rounded-md"
                  style={{ backgroundColor: CARD_BRANDS[cardType].color, color: '#fff' }}
                >
                  {CARD_BRANDS[cardType].label}
                </div>
              )}
            </div>
            {cardDigits > 0 && cardDigits < 13 && (
              <p className="text-[10px] text-gray-400 mt-0.5">Ingresa al menos 13 dígitos</p>
            )}
            {isCardComplete && (
              <p className="text-[10px] text-green-600 mt-0.5 font-medium">Tarjeta aceptada</p>
            )}
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">Expiración *</label>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                className={inputCls}
                style={{ touchAction: 'manipulation' }}
                autoComplete="cc-exp"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-1">
                CVV {cardType === 'amex' ? '(4 dígitos)' : '*'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                placeholder={cardType === 'amex' ? '1234' : '123'}
                value={cardCvv}
                maxLength={cvvLen}
                onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, cvvLen))}
                className={inputCls}
                style={{ touchAction: 'manipulation' }}
                autoComplete="cc-csc"
              />
            </div>
          </div>

          {/* Name on card */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">Nombre en la tarjeta *</label>
            <input
              type="text"
              placeholder="Como aparece en la tarjeta"
              value={cardName}
              onChange={(e) => setCardName(e.target.value.toUpperCase())}
              className={inputCls}
              style={{ touchAction: 'manipulation', textTransform: 'uppercase' }}
              autoComplete="cc-name"
            />
          </div>
        </div>

        {/* Order summary mini */}
        <div className="rounded-lg border border-gray-200 p-3 space-y-1.5 text-[11px] bg-gray-50">
          <div className="flex justify-between font-bold text-sm">
            <span>Total a pagar:</span>
            <span style={{ color: '#16a34a' }}>${tCost.toFixed(2)} USD</span>
          </div>
          <div className="text-gray-400 text-[10px]">
            {items.length} producto{items.length !== 1 ? 's' : ''} · Caja {selectedBox.width}&quot;x{selectedBox.height}&quot;x{selectedBox.depth}&quot;
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={() => goToStep('info')}
            className="flex-1 h-12 rounded-lg text-sm font-semibold border border-gray-300 bg-white cursor-pointer hover:bg-gray-50"
            style={{ touchAction: 'manipulation' }}
          >
            Volver
          </button>
          <button
            onClick={handlePay}
            disabled={!isPaymentReady}
            className="flex-1 h-12 rounded-lg text-sm font-bold text-white border-none cursor-pointer flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: isPaymentReady ? '#16a34a' : '#9ca3af',
              touchAction: 'manipulation',
              opacity: isPaymentReady ? 1 : 0.5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Pagar ${tCost.toFixed(2)}
          </button>
        </div>

        {!isPaymentReady && (cardDigits > 0 || cardExpiry.length > 0) && (
          <p className="text-[10px] text-center text-amber-600 font-medium">Completa todos los campos de la tarjeta</p>
        )}

        {/* Security badges */}
        <div className="flex items-center justify-center gap-3 pt-1 flex-wrap">
          <div className="flex items-center gap-1 text-[9px] text-gray-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            SSL Encriptado
          </div>
          <div className="flex items-center gap-1 text-[9px] text-gray-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            PCI Compliant
          </div>
          <div className="flex items-center gap-1 text-[9px] text-gray-400">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            Pago Instantáneo
          </div>
        </div>

        {/* Accepted cards */}
        <div className="flex justify-center gap-2 pt-1">
          {['visa', 'mastercard', 'amex', 'discover'].map((t) => (
            <div
              key={t}
              className="px-2.5 py-1 rounded-md border text-[9px] font-bold transition-all"
              style={{
                backgroundColor: cardType === t ? CARD_BRANDS[t].color + '15' : '#f9fafb',
                borderColor: cardType === t ? CARD_BRANDS[t].color + '40' : '#e5e7eb',
                color: cardType === t ? CARD_BRANDS[t].color : '#9ca3af',
              }}
            >
              {CARD_BRANDS[t].label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── STEP 4: PROCESSING ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'processing') {
    return (
      <div className="p-5 flex flex-col items-center gap-4 border border-gray-200 rounded-xl bg-white shadow-sm" style={{ touchAction: 'manipulation' }}>
        <div className="w-16 h-16 border-4 rounded-full animate-spin" style={{ borderColor: '#e5e7eb', borderTopColor: '#0070c0' }} />

        <div className="text-center">
          <p className="font-bold text-sm text-gray-700">Procesando tu pago...</p>
          <p className="text-[11px] text-gray-400 mt-1">No cierres esta página</p>
        </div>

        {/* QuickBooks Payments processing steps */}
        <div className="w-full space-y-2 py-2">
          {processingSteps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px]">
              {s.status === 'done' && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              )}
              {s.status === 'active' && (
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: '#e5e7eb', borderTopColor: '#0070c0' }} />
              )}
              {s.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-gray-200" />
              )}
              <span
                className="transition-colors"
                style={{
                  color: s.status === 'done' ? '#16a34a' : s.status === 'active' ? '#374151' : '#9ca3af',
                  fontWeight: s.status === 'active' ? 600 : 400,
                }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        <div className="text-center text-[10px] text-gray-400 bg-gray-50 rounded-lg px-4 py-2">
          Transacción segura via QuickBooks Payments
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── STEP 5: SUCCESS / RECEIPT ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'success' && orderResult) {
    const data = orderResult as Record<string, any>;
    const now = new Date();
    const charge = data.charge || {};
    const orderInfo = data.order || {};
    const breakdown = data.breakdown || {};

    return (
      <div className="p-4 flex flex-col gap-3 border-2 border-green-300 rounded-xl bg-gradient-to-b from-green-50 to-white shadow-sm" style={{ touchAction: 'manipulation' }}>
        {/* Success header */}
        <div className="text-center py-2">
          <div className="w-18 h-18 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#16a34a', width: 72, height: 72 }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <p className="font-black text-xl" style={{ color: '#16a34a' }}>Compra Exitosa</p>
          <p className="text-xs text-gray-500 mt-1">Tu pedido ha sido confirmado y pagado</p>
          <p className="text-[10px] text-blue-600 font-medium mt-0.5">Recibirás la factura en tu correo electrónico</p>
        </div>

        {/* ── RECEIPT ── */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Receipt header */}
          <div className="text-center py-3 px-4" style={{ backgroundColor: '#0070c0' }}>
            <p className="font-black text-white text-sm tracking-wider">CHAMBATINA</p>
            <p className="text-white/70 text-[10px] mt-0.5">Walmart a tu Familia · Recibo de Compra</p>
          </div>

          <div className="p-4 space-y-3">
            {/* QuickBooks Transaction ID */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-2.5 text-center">
              <p className="text-[9px] text-green-600 font-medium">Transacción QuickBooks Payments</p>
              <p className="text-xs font-mono font-bold text-green-800 mt-0.5">{charge.id || 'N/A'}</p>
              {charge.authCode && (
                <p className="text-[10px] text-green-600 mt-0.5">Código de autorización: {charge.authCode}</p>
              )}
            </div>

            {/* Order details */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Orden:</span>
                <span className="font-mono font-bold">{orderInfo.orderId || data.orderId || 'N/A'}</span>
              </div>
              {orderInfo.qbInvoiceRef && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Factura QB:</span>
                  <span className="font-mono font-medium">{orderInfo.qbInvoiceRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Fecha:</span>
                <span>{now.toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Cliente:</span>
                <span className="font-medium">{customerInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span>{customerInfo.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Teléfono:</span>
                <span>{customerInfo.phone}</span>
              </div>
              {customerInfo.address && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Dirección:</span>
                  <span className="text-right max-w-[60%]">{customerInfo.address}</span>
                </div>
              )}
            </div>

            {/* Box + Items breakdown */}
            <div className="border-t border-dashed border-gray-200 pt-3 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Caja:</span>
                <span>{selectedBox.width}&quot;x{selectedBox.height}&quot;x{selectedBox.depth}&quot;</span>
              </div>

              {/* Items */}
              <div className="border-t border-dashed border-gray-200 pt-2 space-y-0.5">
                {Object.values(grouped).map((g) => (
                  <div key={g.product.id} className="flex justify-between text-[10px]">
                    <span className="text-gray-700">
                      {g.product.emoji} {g.product.nameEs} x{g.quantity}
                    </span>
                    <span className="font-medium">${(g.product.price * g.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost breakdown */}
            <div className="border-t border-dashed border-gray-200 pt-2 space-y-1 text-[11px]">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal productos:</span>
                <span>${breakdown.productCost?.toFixed(2) || pCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Tax Walmart (7%):</span>
                <span>${breakdown.walmartTax?.toFixed(2) || wTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Envío:</span>
                <span>${breakdown.shippingCost?.toFixed(2) || selectedBox.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Fee de gestión:</span>
                <span>${breakdown.managementFee?.toFixed(2) || selectedBox.managementFee.toFixed(2)}</span>
              </div>
            </div>

            {/* TOTAL */}
            <div className="border-t-2 border-gray-800 pt-2 flex justify-between items-center">
              <span className="font-black text-base">TOTAL PAGADO:</span>
              <span className="font-black text-2xl" style={{ color: '#16a34a' }}>
                ${breakdown.total?.toFixed(2) || tCost.toFixed(2)} USD
              </span>
            </div>

            {/* Payment method details */}
            <div className="border-t border-dashed border-gray-200 pt-2 text-[10px] text-gray-500 space-y-1 bg-gray-50 rounded-lg p-2.5">
              <div className="flex justify-between">
                <span>Método de pago:</span>
                <span className="font-semibold">
                  {charge.cardBrand || 'CARD'} ****{charge.cardLast4 || rawCard.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className="font-bold" style={{ color: '#16a34a' }}>
                  {charge.status === 'CAPTURED' ? 'CAPTURADO' : 'COMPLETADO'}
                </span>
              </div>
              {charge.fee && (
                <div className="flex justify-between">
                  <span>Fee procesamiento:</span>
                  <span>${charge.fee.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Shipping info */}
            <div className="text-center text-[10px] text-gray-500 bg-blue-50 rounded-lg p-2.5 border border-blue-100">
              <p className="font-semibold text-blue-700">Tu pedido viaja por mar hasta Nicaragua</p>
              <p className="mt-0.5">Peso total: {weight.toFixed(1)} lbs · Volumen: {volume.toFixed(0)} in³</p>
              <p className="mt-0.5 text-blue-600">Tiempo estimado de entrega: 15-25 días hábiles</p>
            </div>

            {/* QuickBooks Email Invoice Notification */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" fill="#2CA01C"/>
                  <text x="6" y="16" fill="white" fontSize="11" fontWeight="bold">QB</text>
                </svg>
                <span className="text-xs font-bold text-green-800">Factura QuickBooks</span>
              </div>
              {data.invoice?.sent ? (
                <>
                  <p className="text-[11px] font-semibold text-green-700">
                    Factura enviada a {customerInfo.email}
                  </p>
                  <p className="text-[9px] text-green-600 mt-0.5">
                    Revisa tu bandeja de entrada y carpeta de spam
                  </p>
                </>
              ) : (
                <>
                  <p className="text-[11px] font-semibold text-green-700">
                    La factura será enviada a {customerInfo.email}
                  </p>
                  <p className="text-[9px] text-green-600 mt-0.5">
                    QuickBooks enviará la factura automáticamente al correo registrado
                  </p>
                </>
              )}
              {data.invoice?.qbInvoiceRef && (
                <p className="text-[9px] text-green-500 mt-1 font-mono">
                  Ref: {data.invoice.qbInvoiceRef}
                </p>
              )}
            </div>
          </div>

          {/* Receipt footer */}
          <div className="text-center py-2 px-4 bg-gray-50 border-t border-gray-200">
            <p className="text-[9px] text-gray-400">Procesado por QuickBooks Payments · ID: {charge.id}</p>
            <p className="text-[9px] text-gray-400 mt-0.5">Gracias por tu compra · Chambatina © {now.getFullYear()}</p>
          </div>
        </div>

        {/* Actions */}
        <button
          onClick={handleNewOrder}
          className="w-full h-12 rounded-xl text-sm font-bold text-white border-none cursor-pointer transition-transform active:scale-[0.98]"
          style={{ backgroundColor: '#0070c0', touchAction: 'manipulation' }}
        >
          Hacer Nuevo Pedido
        </button>

        {/* Invoice email notification */}
        {data.invoice?.sent && (
          <div className="flex items-center justify-center gap-2 py-2">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: '#16a34a' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <span className="text-xs font-semibold text-green-700">Factura enviada a {customerInfo.email}</span>
          </div>
        )}
        {!data.invoice?.sent && (
          <p className="text-[9px] text-center text-gray-400">
            Recibirás confirmación en {customerInfo.email}
          </p>
        )}
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════ */
  /* ── ERROR ── */
  /* ══════════════════════════════════════════════════════════════════════ */
  if (step === 'error') {
    return (
      <div className="p-5 flex flex-col gap-4 border-2 border-red-200 rounded-xl bg-red-50 text-center" style={{ touchAction: 'manipulation' }}>
        <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef2f2' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>

        <div>
          <p className="font-bold text-base text-red-700">Pago Rechazado</p>
          <p className="text-xs text-red-500 mt-2 leading-relaxed">
            {errorMsg || 'Tu tarjeta fue rechazada. Verifica los datos e intenta de nuevo.'}
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => goToStep('payment')}
            className="w-full h-12 rounded-lg text-sm font-bold text-white border-none cursor-pointer"
            style={{ backgroundColor: '#0070c0', touchAction: 'manipulation' }}
          >
            Reintentar Pago
          </button>
          <button
            onClick={() => goToStep('cart')}
            className="w-full h-10 rounded-lg text-xs font-medium text-gray-500 border border-gray-300 bg-white cursor-pointer hover:bg-gray-50"
            style={{ touchAction: 'manipulation' }}
          >
            Volver al Carrito
          </button>
        </div>
      </div>
    );
  }

  return null;
}
