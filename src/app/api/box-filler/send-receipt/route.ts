import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { generateInvoiceEmail } from '@/lib/invoice-email';

/* ═══════════════════════════════════════════════════════════════════════════
   Send Receipt Email — QuickBooks-Style Invoice
   
   After a successful payment, this endpoint sends a professional invoice
   email to the customer, exactly like QuickBooks does natively.
   
   Uses Resend (resend.com) for email delivery.
   Free tier: 100 emails/day, 3,000/month.
   ═══════════════════════════════════════════════════════════════════════════ */

const resendApiKey = process.env.RESEND_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customerEmail,
      customerName,
      orderId,
      qbInvoiceRef,
      qbTransactionId,
      authCode,
      date,
      boxSize,
      items,
      breakdown,
      charge,
    } = body;

    if (!customerEmail || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Datos insuficientes para enviar la factura' },
        { status: 400 }
      );
    }

    // ─── Check if Resend is configured ───
    if (!resendApiKey) {
      console.warn('[RESEND] No API key configured. Skipping email. Set RESEND_API_KEY in environment.');
      return NextResponse.json({
        success: false,
        error: 'Email service not configured',
        skipped: true,
      });
    }

    // ─── Initialize Resend ───
    const resend = new Resend(resendApiKey);

    // ─── Generate invoice HTML ───
    const invoiceHtml = generateInvoiceEmail({
      orderId,
      qbInvoiceRef: qbInvoiceRef || '',
      qbTransactionId: qbTransactionId || '',
      authCode: authCode || '',
      customerName: customerName || 'Cliente',
      customerEmail,
      customerPhone: body.customerPhone || '',
      customerAddress: body.customerAddress || '',
      date: date || new Date().toLocaleDateString('es-NI', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      boxSize: boxSize || 'N/A',
      items: (items || []).map((item: { name: string; quantity: number; price: number; weight: number }) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        weight: item.weight,
      })),
      productCost: breakdown?.productCost || 0,
      walmartTax: breakdown?.walmartTax || 0,
      shippingCost: breakdown?.shippingCost || 0,
      managementFee: breakdown?.managementFee || 0,
      total: breakdown?.total || 0,
      cardBrand: charge?.cardBrand || 'CARD',
      cardLast4: charge?.cardLast4 || '****',
      processingFee: charge?.fee || 0,
      netAmount: charge?.netAmount || 0,
    });

    // ─── Send email ───
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'Chambatina <onboarding@resend.dev>',
      to: [customerEmail],
      subject: `Factura ${qbInvoiceRef || orderId} — Chambatina Walmart a tu Familia`,
      html: invoiceHtml,
      headers: {
        'X-Priority': '1',
        'X-Mailer': 'QuickBooks Payments / Chambatina',
      },
    });

    if (error) {
      console.error('[RESEND] Email send error:', error);
      return NextResponse.json({
        success: false,
        error: 'Error al enviar la factura por correo',
        details: error.message,
      });
    }

    console.log(`[RESEND] Invoice email sent to ${customerEmail} — ${data?.id}`);

    return NextResponse.json({
      success: true,
      emailId: data?.id,
      message: `Factura enviada a ${customerEmail}`,
    });
  } catch (error) {
    console.error('[RESEND] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Error interno al enviar la factura' },
      { status: 500 }
    );
  }
}
