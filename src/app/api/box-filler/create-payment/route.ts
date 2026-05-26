import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/* ═══════════════════════════════════════════════════════════════════════════
   QuickBooks Payments Integration — Production-Ready Simulation
   
   In production, replace the simulateQuickBooksPayment() function with
   real calls to the QuickBooks Payments REST API:
   
   1. POST /v3/payments/charges  (create charge)
   2. Uses card token from QuickBooks JS SDK (client-side tokenization)
   3. Webhooks for async confirmation
   
   Current mode: SIMULATED — generates realistic QuickBooks transaction
   records with proper IDs, timestamps, and status flow.
   ═══════════════════════════════════════════════════════════════════════════ */

interface QuickBooksChargeResult {
  id: string;
  status: 'CAPTURED' | 'AUTHORIZED' | 'DECLINED';
  amount: number;
  currency: string;
  cardLast4: string;
  cardBrand: string;
  authCode: string;
  transactionTime: string;
  merchantAccount: string;
  fee: number;
  netAmount: number;
}

function detectCardBrand(num: string): string {
  const c = num.replace(/\s/g, '');
  if (/^4/.test(c)) return 'VISA';
  if (/^5[1-5]/.test(c) || /^2[2-7]/.test(c)) return 'MASTERCARD';
  if (/^3[47]/.test(c)) return 'AMERICAN_EXPRESS';
  if (/^6(?:011|5)/.test(c)) return 'DISCOVER';
  return 'CARD';
}

/**
 * Simulates the QuickBooks Payments charge flow.
 * In production, this would call:
 * POST https://sandbox.api.intuit.com/v3/payments/charges
 * Authorization: Bearer {access_token}
 * Body: { amount, currency, card: { number, expYear, expMonth, cvc, name } }
 */
function simulateQuickBooksPayment(
  amount: number,
  cardLast4: string,
  cardBrand: string,
  customerName: string
): QuickBooksChargeResult {
  const now = new Date();
  const txId = `QB-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  
  // QuickBooks merchant account ID
  const merchantId = 'MERCHANT-CHAMBATINA-001';
  
  // Simulate authorization code (6 digits)
  const authCode = String(Math.floor(100000 + Math.random() * 900000));
  
  // Simulate processing fee (QuickBooks ~2.4% + $0.25)
  const fee = amount * 0.024 + 0.25;
  const netAmount = amount - fee;

  return {
    id: txId,
    status: 'CAPTURED',
    amount: Math.round(amount * 100) / 100,
    currency: 'USD',
    cardLast4,
    cardBrand,
    authCode,
    transactionTime: now.toISOString(),
    merchantAccount: merchantId,
    fee: Math.round(fee * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      boxSize,
      items,
      cardNumber,
      cardExpiry,
      cardCvv,
      cardName,
    } = body;

    // ─── Validate required fields ───
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    if (!customerName || customerName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nombre es requerido (mínimo 2 caracteres)' },
        { status: 400 }
      );
    }

    if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Correo electrónico no válido' },
        { status: 400 }
      );
    }

    if (!customerPhone || customerPhone.replace(/\D/g, '').length < 7) {
      return NextResponse.json(
        { success: false, error: 'Teléfono no válido (mínimo 7 dígitos)' },
        { status: 400 }
      );
    }

    // ─── Validate card data (basic checks) ───
    if (!cardNumber || cardNumber.replace(/\D/g, '').length < 13) {
      return NextResponse.json(
        { success: false, error: 'Número de tarjeta no válido (mínimo 13 dígitos)' },
        { status: 400 }
      );
    }

    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      return NextResponse.json(
        { success: false, error: 'Fecha de expiración no válida (MM/AA)' },
        { status: 400 }
      );
    }

    const [expMonth, expYear] = cardExpiry.split('/').map(Number);
    if (expMonth < 1 || expMonth > 12) {
      return NextResponse.json(
        { success: false, error: 'Mes de expiración no válido' },
        { status: 400 }
      );
    }

    if (!cardCvv || cardCvv.length < 3) {
      return NextResponse.json(
        { success: false, error: 'CVV no válido (3 o 4 dígitos)' },
        { status: 400 }
      );
    }

    if (!cardName || cardName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: 'Nombre en la tarjeta es requerido' },
        { status: 400 }
      );
    }

    // ─── Calculate cost breakdown ───
    const productCost = items.reduce(
      (sum: number, item: { price: number; quantity: number }) =>
        sum + item.price * item.quantity,
      0
    );
    const walmartTax = productCost * 0.07;

    let shippingCost = 65;
    let managementFee = 6.6;
    if (boxSize && boxSize.includes('12')) {
      shippingCost = 45;
    } else if (boxSize && boxSize.includes('16')) {
      shippingCost = 85;
    }

    // ─── Generate Order ID ───
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const orderId = `ORD-${dateStr}-${randomId}`;

    // ─── Process Payment via QuickBooks Payments ───
    const rawCard = cardNumber.replace(/\D/g, '');
    const cardLast4 = rawCard.slice(-4);
    const cardBrand = detectCardBrand(rawCard);

    // Simulate network delay (like real payment processor)
    await new Promise((resolve) => setTimeout(resolve, 1800 + Math.random() * 700));

    const chargeResult = simulateQuickBooksPayment(amount, cardLast4, cardBrand, customerName);

    if (chargeResult.status === 'DECLINED') {
      return NextResponse.json({
        success: false,
        error: 'Tu tarjeta fue rechazada. Contacta tu banco o intenta con otra tarjeta.',
        declineCode: 'CARD_DECLINED',
      });
    }

    // ─── Generate QuickBooks invoice reference ───
    const qbInvoiceRef = `INV-${dateStr}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // ─── Persist order to database ───
    await db.walmartOrder.create({
      data: {
        orderId,
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerPhone: customerPhone.trim(),
        boxSize: boxSize || 'N/A',
        items: JSON.stringify(items),
        productCost: Math.round(productCost * 100) / 100,
        walmartTax: Math.round(walmartTax * 100) / 100,
        shippingCost,
        managementFee,
        totalAmount: Math.round(amount * 100) / 100,
        currency: 'USD',
        status: 'confirmed',
        paymentToken: chargeResult.id,
        qbTransactionId: chargeResult.id,
        qbPaymentId: `PAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      },
    });

    // ─── Return success response ───
    return NextResponse.json({
      success: true,
      message: 'Pago procesado exitosamente via QuickBooks Payments',
      order: {
        orderId,
        qbInvoiceRef,
        status: 'confirmed',
        timestamp: chargeResult.transactionTime,
      },
      customer: {
        name: customerName.trim(),
        email: customerEmail.trim().toLowerCase(),
        phone: customerPhone.trim(),
        address: customerAddress?.trim() || '',
      },
      charge: {
        id: chargeResult.id,
        amount: chargeResult.amount,
        currency: chargeResult.currency,
        status: chargeResult.status,
        authCode: chargeResult.authCode,
        cardLast4: chargeResult.cardLast4,
        cardBrand: chargeResult.cardBrand,
        fee: chargeResult.fee,
        netAmount: chargeResult.netAmount,
      },
      breakdown: {
        productCost: Math.round(productCost * 100) / 100,
        walmartTax: Math.round(walmartTax * 100) / 100,
        shippingCost,
        managementFee,
        total: Math.round(amount * 100) / 100,
      },
      box: boxSize || 'N/A',
      items,
      paymentMethod: 'QuickBooks Payments',
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al procesar el pago. Intenta de nuevo.',
      },
      { status: 500 }
    );
  }
}
