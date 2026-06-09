import { db } from '@/lib/db';
import { stringifyExtraFields } from '@/lib/llc-utils';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const state = searchParams.get('state');
    const assignedTo = searchParams.get('assignedTo');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (state) where.stateCode = state;
    if (assignedTo) where.assignedTo = assignedTo;

    const filings = await db.lLCFiling.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(filings);
  } catch (error) {
    console.error('Error fetching filings:', error);
    return NextResponse.json(
      { error: 'Error al obtener las presentaciones' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    let stateFee: number | null = null;
    const stateReq = await db.stateRequirement.findUnique({
      where: { stateCode: body.stateCode },
    });
    if (stateReq?.filingFee) {
      stateFee = stateReq.filingFee;
    }
    const serviceFee = 150;
    const totalFee = (stateFee ?? 0) + serviceFee;

    const filing = await db.lLCFiling.create({
      data: {
        stateCode: body.stateCode,
        llcName: body.llcName,
        dbaName: body.dbaName || null,
        businessPurpose: body.businessPurpose || null,
        duration: body.duration || 'perpetual',
        raName: body.raName,
        raAddress1: body.raAddress1,
        raCity: body.raCity,
        raState: body.raState,
        raZip: body.raZip,
        paAddress1: body.paAddress1,
        paAddress2: body.paAddress2 || null,
        paCity: body.paCity,
        paState: body.paState,
        paZip: body.paZip,
        organizerName: body.organizerName,
        organizerTitle: body.organizerTitle || 'Organizador',
        organizerEmail: body.organizerEmail || null,
        organizerPhone: body.organizerPhone || null,
        managementType: body.managementType || 'member-managed',
        extraFields: stringifyExtraFields(body.extraFields || {}),
        status: 'draft',
        assignedTo: body.assignedTo || null,
        clientName: body.clientName || null,
        clientEmail: body.clientEmail || null,
        clientPhone: body.clientPhone || null,
        stateFee,
        serviceFee,
        totalFee,
        internalNotes: body.internalNotes || null,
      },
    });

    return NextResponse.json(filing, { status: 201 });
  } catch (error) {
    console.error('Error creating filing:', error);
    return NextResponse.json(
      { error: 'Error al crear la presentación' },
      { status: 500 }
    );
  }
}
