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

    if (!body.signatureData) {
      return NextResponse.json(
        { error: 'La firma es requerida' },
        { status: 400 }
      );
    }

    const filing = await db.lLCFiling.update({
      where: { id },
      data: {
        signatureData: body.signatureData,
        signedAt: new Date().toISOString(),
        status: 'signed',
      },
    });

    return NextResponse.json(filing);
  } catch (error) {
    console.error('Error saving signature:', error);
    return NextResponse.json(
      { error: 'Error al guardar la firma' },
      { status: 500 }
    );
  }
}
