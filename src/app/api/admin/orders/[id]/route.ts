import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['pending', 'processing', 'purchased', 'shipped', 'delivered'].includes(status)) {
      return NextResponse.json(
        { error: 'Estado invalido' },
        { status: 400 }
      );
    }

    const order = await db.walmartOrder.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la orden' },
      { status: 500 }
    );
  }
}
