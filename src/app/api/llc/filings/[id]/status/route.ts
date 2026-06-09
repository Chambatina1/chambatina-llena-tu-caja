import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existing = await db.lLCFiling.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Presentación no encontrada' },
        { status: 404 }
      );
    }

    const validStatuses = ['draft', 'review', 'client_reviewed', 'signed', 'filed'];
    if (!validStatuses.includes(body.status)) {
      return NextResponse.json(
        { error: 'Estado inválido' },
        { status: 400 }
      );
    }

    const filing = await db.lLCFiling.update({
      where: { id },
      data: { status: body.status },
    });

    return NextResponse.json(filing);
  } catch (error) {
    console.error('Error updating status:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estado' },
      { status: 500 }
    );
  }
}
