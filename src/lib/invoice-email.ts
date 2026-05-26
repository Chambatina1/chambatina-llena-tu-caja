/* ═══════════════════════════════════════════════════════════════════════════
   QuickBooks-Style Invoice Email Template
   
   Generates a professional HTML email that mimics QuickBooks' native
   invoice/receipt email — company header, bill-to, itemized table,
   totals, payment details, and footer.
   ═══════════════════════════════════════════════════════════════════════════ */

interface InvoiceData {
  orderId: string;
  qbInvoiceRef: string;
  qbTransactionId: string;
  authCode: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  date: string;
  boxSize: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    weight: number;
  }>;
  productCost: number;
  walmartTax: number;
  shippingCost: number;
  managementFee: number;
  total: number;
  cardBrand: string;
  cardLast4: string;
  processingFee: number;
  netAmount: number;
}

export function generateInvoiceEmail(data: InvoiceData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
      <tr>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151;">
          ${item.name}
          <span style="color: #9ca3af; font-size: 11px;"> · ${item.weight} lb c/u</span>
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; text-align: right;">
          $${item.price.toFixed(2)}
        </td>
        <td style="padding: 10px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151; text-align: right; font-weight: 600;">
          $${(item.price * item.quantity).toFixed(2)}
        </td>
      </tr>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Factura ${data.qbInvoiceRef} — Chambatina</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">

  <!-- Email wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f5f7; padding: 32px 0;">
    <tr>
      <td align="center">

        <!-- Main card -->
        <table width="640" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin: 0 16px;">

          <!-- ─── HEADER (QuickBooks green bar) ─── -->
          <tr>
            <td style="background: linear-gradient(135deg, #0070c0 0%, #005a9e 100%); padding: 24px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: 1px;">
                      CHAMBATINA
                    </h1>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.75);">
                      Walmart a tu Familia · Servicio de Cajas a Nicaragua
                    </p>
                  </td>
                  <td align="right">
                    <table cellpadding="0" cellspacing="0" style="background: rgba(255,255,255,0.15); border-radius: 8px; padding: 8px 14px;">
                      <tr>
                        <td style="font-size: 10px; color: rgba(255,255,255,0.7); text-transform: uppercase; letter-spacing: 0.5px;">
                          Factura
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 16px; color: #ffffff; font-weight: 700; letter-spacing: 0.5px;">
                          ${data.qbInvoiceRef}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── PAID BADGE ─── -->
          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <table cellpadding="0" cellspacing="0" style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 10px 16px;">
                      <tr>
                        <td style="padding-right: 10px;">
                          <div style="width: 28px; height: 28px; background-color: #16a34a; border-radius: 50%; text-align: center; line-height: 28px; color: white; font-size: 14px; font-weight: bold;">
                            &#10003;
                          </div>
                        </td>
                        <td>
                          <p style="margin: 0; font-size: 14px; font-weight: 700; color: #16a34a;">
                            Pago Completado Exitosamente
                          </p>
                          <p style="margin: 2px 0 0 0; font-size: 11px; color: #6b7280;">
                            Transacción QuickBooks Payments · ${data.date}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── CUSTOMER + INVOICE INFO ─── -->
          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <!-- Bill To -->
                  <td width="50%" style="vertical-align: top;">
                    <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">
                      Facturar A
                    </p>
                    <p style="margin: 0; font-size: 15px; font-weight: 600; color: #111827;">
                      ${data.customerName}
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 13px; color: #6b7280;">${data.customerEmail}</p>
                    <p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280;">${data.customerPhone}</p>
                    ${data.customerAddress ? `<p style="margin: 2px 0 0 0; font-size: 13px; color: #6b7280;">${data.customerAddress}</p>` : ''}
                  </td>
                  <!-- Order Details -->
                  <td width="50%" style="vertical-align: top; text-align: right;">
                    <table cellpadding="0" cellspacing="0" style="margin-left: auto;">
                      <tr>
                        <td style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 2px;">
                          Orden
                        </td>
                        <td style="font-size: 13px; font-weight: 600; color: #111827; padding-left: 12px;">
                          ${data.orderId}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 2px; padding-top: 6px;">
                          Transacción QB
                        </td>
                        <td style="font-size: 13px; font-weight: 600; color: #111827; padding-left: 12px;">
                          ${data.qbTransactionId}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 2px; padding-top: 6px;">
                          Auth Code
                        </td>
                        <td style="font-size: 13px; font-weight: 600; color: #111827; padding-left: 12px;">
                          ${data.authCode}
                        </td>
                      </tr>
                      <tr>
                        <td style="font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; padding-bottom: 2px; padding-top: 6px;">
                          Caja
                        </td>
                        <td style="font-size: 13px; font-weight: 600; color: #111827; padding-left: 12px;">
                          ${data.boxSize}
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── ITEMS TABLE ─── -->
          <tr>
            <td style="padding: 24px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
                <!-- Header -->
                <tr style="background-color: #f9fafb;">
                  <th align="left" style="padding: 10px 16px; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Producto
                  </th>
                  <th align="center" style="padding: 10px 16px; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Cant.
                  </th>
                  <th align="right" style="padding: 10px 16px; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Precio
                  </th>
                  <th align="right" style="padding: 10px 16px; font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e5e7eb;">
                    Total
                  </th>
                </tr>
                <!-- Items -->
                ${itemsHtml}
              </table>
            </td>
          </tr>

          <!-- ─── TOTALS ─── -->
          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <table width="320" cellpadding="0" cellspacing="0" style="float: right;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                    Subtotal productos
                  </td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; color: #374151; font-weight: 500;">
                    $${data.productCost.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                    Tax Walmart (7%)
                  </td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; color: #374151; font-weight: 500;">
                    $${data.walmartTax.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                    Envío marítimo
                  </td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; color: #374151; font-weight: 500;">
                    $${data.shippingCost.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #6b7280;">
                    Fee de gestión
                  </td>
                  <td align="right" style="padding: 6px 0; font-size: 13px; color: #374151; font-weight: 500;">
                    $${data.managementFee.toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 10px 0 4px 0; border-top: 2px solid #111827;"></td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-size: 18px; font-weight: 800; color: #111827;">
                    TOTAL PAGADO
                  </td>
                  <td align="right" style="padding: 4px 0; font-size: 22px; font-weight: 800; color: #16a34a;">
                    $${data.total.toFixed(2)} USD
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── PAYMENT METHOD ─── -->
          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px;">
                            Método de Pago
                          </p>
                          <p style="margin: 0; font-size: 14px; font-weight: 600; color: #111827;">
                            ${data.cardBrand} ****${data.cardLast4}
                          </p>
                          <p style="margin: 3px 0 0 0; font-size: 12px; color: #6b7280;">
                            Procesado por QuickBooks Payments
                          </p>
                        </td>
                        <td align="right" style="vertical-align: middle;">
                          <table cellpadding="0" cellspacing="0" style="background-color: #2CA01C; border-radius: 6px; padding: 6px 12px;">
                            <tr>
                              <td style="font-size: 11px; font-weight: 700; color: white; letter-spacing: 0.5px;">
                                QB PAGADO
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── SHIPPING INFO ─── -->
          <tr>
            <td style="padding: 20px 32px 0 32px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
                <tr>
                  <td style="padding: 14px 18px;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #1e40af;">
                      Información de Envío
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #3b82f6;">
                      Tu pedido viaja por mar hasta Nicaragua.
                    </p>
                    <p style="margin: 3px 0 0 0; font-size: 12px; color: #6b7280;">
                      Tiempo estimado de entrega: <strong>15-25 días hábiles</strong>
                    </p>
                    <p style="margin: 3px 0 0 0; font-size: 11px; color: #9ca3af;">
                      Recibirás actualizaciones del estado de tu envío.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- ─── FOOTER ─── -->
          <tr>
            <td style="padding: 28px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
                      Procesado por <strong style="color: #6b7280;">QuickBooks Payments</strong> · ID: ${data.qbTransactionId}
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 11px; color: #d1d5db; text-align: center;">
                      Chambatina © ${new Date().getFullYear()} — Walmart a tu Familia · Todos los derechos reservados
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 10px; color: #d1d5db; text-align: center;">
                      Este correo fue enviado automáticamente por el sistema de pagos. No responder.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
        <!-- End main card -->

      </td>
    </tr>
  </table>

</body>
</html>`;
}
