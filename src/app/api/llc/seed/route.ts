import { db } from '@/lib/db';
import { STATE_DATA } from '@/lib/state-requirements';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Delete existing data first
    await db.stateRequirement.deleteMany({});

    const created = [];

    for (const [code, data] of Object.entries(STATE_DATA)) {
      const state = await db.stateRequirement.create({
        data: {
          stateCode: code,
          stateName: data.stateName,
          filingFee: data.filingFee,
          requiredFields: JSON.stringify(data.requiredFields),
          filingOffice: data.filingOffice,
          processingTime: data.processingTime,
          notes: data.notes,
        },
      });
      created.push(state.stateCode);
    }

    return NextResponse.json({
      success: true,
      message: `${created.length} estados cargados exitosamente`,
      states: created,
    });
  } catch (error) {
    console.error('Error seeding states:', error);
    return NextResponse.json(
      { success: false, message: 'Error al cargar los datos de estados' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const count = await db.stateRequirement.count();
    return NextResponse.json({ count });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
