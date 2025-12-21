import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@cptsd/db/mongodb';
import { JournalEntry, EntryAnalysis } from '@cptsd/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await connectDB();

    const query: any = { userId: userId as any };
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from);
      if (to) query.createdAt.$lte = new Date(to);
    }

    const entries = await JournalEntry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await JournalEntry.countDocuments(query);

    // Get latest analysis for each entry
    const entryIds = entries.map((e: any) => e._id);
    const analyses = await EntryAnalysis.find({
      entryId: { $in: entryIds },
    }).lean();

    const analysisMap = new Map(
      analyses.map((a: any) => [a.entryId.toString(), a])
    );

    return NextResponse.json({
      entries: entries.map((entry: any) => ({
        id: entry._id.toString(),
        source: entry.source,
        rawText: entry.rawText,
        createdAt: entry.createdAt,
        analysis: analysisMap.get(entry._id.toString())
          ? {
              emotions: (analysisMap.get(entry._id.toString()) as any).emotions,
              themes: (analysisMap.get(entry._id.toString()) as any).themes,
              sentimentScore: (analysisMap.get(entry._id.toString()) as any).sentimentScore,
              risk: (analysisMap.get(entry._id.toString()) as any).risk,
            }
          : null,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching entries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

