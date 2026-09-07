import { NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { calculatePositionSummaries, calculateGroupScores } from '@/lib/scoring';

export async function GET() {
  try {
    const banks = await store.getBanks();
    const groups = await store.getGroups();
    const components = await store.getComponents();
    const cells = await store.getCells();

    const positionSummaries = calculatePositionSummaries(banks, components, cells);
    const groupScores = calculateGroupScores(banks, groups, components, cells);

    return NextResponse.json({
      data: {
        banks,
        groups,
        components,
        cells,
        positionSummaries,
        groupScores,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
