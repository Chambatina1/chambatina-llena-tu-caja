import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, customerName, customerEmail, customerPhone, boxSize, items } = body;

    // Validate required fields
    if (!amount || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser mayor a 0' },
        { status: 400 }
      );
    }

    // ─── QuickBooks Payment Integration ───
    // In production, this would call the QuickBooks Payments API:
    // 1. Create a charge using QuickBooks Payments API
    // 2. The customer would be redirected to QuickBooks hosted checkout
    // 3. Or use QuickBooks token-based payment (card on file)
    //
    // For now, we simulate the payment flow:
    // - Generate a simulated payment token
    // - Return a success response with order details

    const paymentToken = `QB_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;

    // Simulate QuickBooks payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Calculate cost breakdown
    const productCost = items.reduce((sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity, 0);
    const walmartTax = productCost * 0.07;

    // Determine shipping cost and management fee from box size
    let shippingCost = 65;
    let managementFee = 6.6;
    if (boxSize.includes('12')) {
      shippingCost = 45;
    } else if (boxSize.includes('16')) {
      shippingCost = 85;
    }

    const qbTransactionId = `TXN_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const qbPaymentId = `PAY_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    // ─── Persist order to database ───
    await db.walmartOrder.create({
      data: {
        orderId,
        customerName,
        customerEmail,
        customerPhone,
        boxSize,
        items: JSON.stringify(items),
        productCost,
        walmartTax,
        shippingCost,
        managementFee,
        totalAmount: amount,
        currency: 'USD',
        status: 'pending',
        paymentToken,
        qbTransactionId,
        qbPaymentId,
      },
    });

    const paymentRecord = {
      orderId,
      paymentToken,
      amount: amount.toFixed(2),
      currency: 'USD',
      status: 'completed',
      customer: {
        name: customerName,
        email: customerEmail,
        phone: customerPhone,
      },
      box: boxSize,
      items: items,
      paymentMethod: 'QuickBooks Payments',
      timestamp: new Date().toISOString(),
      qbTransactionId,
      qbPaymentId,
    };

    return NextResponse.json({
      success: true,
      message: 'Pago procesado exitosamente via QuickBooks Payments',
      ...paymentRecord,
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el pago. Intenta de nuevo.' },
      { status: 500 }
    );
  }
}
