import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@cptsd/db/mongodb';
import { JournalEntry, EntryAnalysis } from '@cptsd/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const { id: entryId } = await params;

    await connectDB();

    const entry = await JournalEntry.findOne({
      _id: entryId,
      userId: userId as any,
    }).lean();

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const analysis = await EntryAnalysis.findOne({
      entryId,
    }).lean();

    return NextResponse.json({
      entry: {
        id: entry._id.toString(),
        source: entry.source,
        rawText: entry.rawText,
        createdAt: entry.createdAt,
      },
      analysis: analysis
        ? {
            emotions: analysis.emotions,
            themes: analysis.themes,
            stressors: analysis.stressors,
            coping: analysis.coping,
            sentimentScore: analysis.sentimentScore,
            risk: analysis.risk,
            createdAt: analysis.createdAt,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Error fetching entry:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

