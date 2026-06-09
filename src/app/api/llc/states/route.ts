import { db } from '@/lib/db';
import { parseExtraFields } from '@/lib/llc-utils';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const states = await db.stateRequirement.findMany({
      orderBy: { stateName: 'asc' },
    });

    const result = states.map((s) => ({
      id: s.id,
      stateCode: s.stateCode,
      stateName: s.stateName,
      filingFee: s.filingFee,
      requiredFields: JSON.parse(s.requiredFields),
      filingOffice: s.filingOffice,
      processingTime: s.processingTime,
      notes: s.notes,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching states:', error);
    return NextResponse.json(
      { error: 'Error al obtener los estados' },
      { status: 500 }
    );
  }
}
