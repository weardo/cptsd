import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { incrementFeaturedContentClick } from '@cptsd/db';

export const dynamic = 'force-dynamic';

export async function POST(
	_req: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		await connectDB();
		const { id } = await params;
		const updated = await incrementFeaturedContentClick(id);
		return NextResponse.json({ ok: true, clickCount: updated?.clickCount ?? null });
	} catch (e) {
		return NextResponse.json({ ok: false }, { status: 200 });
	}
}


