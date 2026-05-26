import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const orders = await db.walmartOrder.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Parse items JSON for each order
    const parsedOrders = orders.map(order => ({
      ...order,
      items: JSON.parse(order.items),
    }));

    return NextResponse.json({ success: true, orders: parsedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Error al obtener las ordenes' },
      { status: 500 }
    );
  }
}
