import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filing = await db.lLCFiling.findUnique({
      where: { id },
    });

    if (!filing) {
      return NextResponse.json(
        { error: 'Presentación no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(filing);
  } catch (error) {
    console.error('Error fetching filing:', error);
    return NextResponse.json(
      { error: 'Error al obtener la presentación' },
      { status: 500 }
    );
  }
}

export async function PUT(
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

    const filing = await db.lLCFiling.update({
      where: { id },
      data: {
        ...(body.llcName !== undefined && { llcName: body.llcName }),
        ...(body.dbaName !== undefined && { dbaName: body.dbaName || null }),
        ...(body.businessPurpose !== undefined && { businessPurpose: body.businessPurpose || null }),
        ...(body.duration !== undefined && { duration: body.duration || null }),
        ...(body.managementType !== undefined && { managementType: body.managementType }),
        ...(body.raName !== undefined && { raName: body.raName }),
        ...(body.raAddress1 !== undefined && { raAddress1: body.raAddress1 }),
        ...(body.raCity !== undefined && { raCity: body.raCity }),
        ...(body.raState !== undefined && { raState: body.raState }),
        ...(body.raZip !== undefined && { raZip: body.raZip }),
        ...(body.paAddress1 !== undefined && { paAddress1: body.paAddress1 }),
        ...(body.paAddress2 !== undefined && { paAddress2: body.paAddress2 || null }),
        ...(body.paCity !== undefined && { paCity: body.paCity }),
        ...(body.paState !== undefined && { paState: body.paState }),
        ...(body.paZip !== undefined && { paZip: body.paZip }),
        ...(body.organizerName !== undefined && { organizerName: body.organizerName }),
        ...(body.organizerTitle !== undefined && { organizerTitle: body.organizerTitle }),
        ...(body.organizerEmail !== undefined && { organizerEmail: body.organizerEmail || null }),
        ...(body.organizerPhone !== undefined && { organizerPhone: body.organizerPhone || null }),
        ...(body.extraFields !== undefined && { extraFields: JSON.stringify(body.extraFields) }),
        ...(body.assignedTo !== undefined && { assignedTo: body.assignedTo || null }),
        ...(body.clientName !== undefined && { clientName: body.clientName || null }),
        ...(body.clientEmail !== undefined && { clientEmail: body.clientEmail || null }),
        ...(body.clientPhone !== undefined && { clientPhone: body.clientPhone || null }),
        ...(body.internalNotes !== undefined && { internalNotes: body.internalNotes || null }),
        ...(body.stateFee !== undefined && { stateFee: body.stateFee }),
        ...(body.serviceFee !== undefined && { serviceFee: body.serviceFee }),
        ...(body.totalFee !== undefined && { totalFee: body.totalFee }),
      },
    });

    return NextResponse.json(filing);
  } catch (error) {
    console.error('Error updating filing:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la presentación' },
      { status: 500 }
    );
  }
}
