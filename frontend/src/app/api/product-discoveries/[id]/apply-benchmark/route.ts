import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';
import { ScoreValue } from '@/types';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const score = body.score as ScoreValue | undefined;
    const description = body.description as string | undefined;
    const componentId = body.component_id as string | undefined;
    const userId = body.user_id as string | undefined;

    const result = await store.applyDiscoveryToBenchmark(
      id,
      score,
      description,
      componentId,
      userId
    );

    return NextResponse.json({
      success: true,
      message: 'Đã cập nhật an toàn vào Ma trận Benchmark!',
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
