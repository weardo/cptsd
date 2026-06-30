import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@cptsd/db/mongodb';
import { WeeklyInsight, Job, JobType, JobStatus } from '@cptsd/db';
import { z } from 'zod';

const generateInsightSchema = z.object({
  weekStart: z.string().datetime(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const validated = generateInsightSchema.parse(body);

    await connectDB();

    // Enqueue job (userId is stored on the job document, not in payload)
    const job = await Job.create({
      type: JobType.WEEKLY_INSIGHT,
      status: JobStatus.PENDING,
      userId: userId as any,
      payload: { weekStart: validated.weekStart },
      runAt: new Date(),
    });

    return NextResponse.json({
      jobId: (job._id as any).toString(),
      status: 'enqueued',
    });
  } catch (error: any) {
    console.error('Error enqueueing weekly insight:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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

    await connectDB();

    const query: any = { userId: userId as any };
    if (from || to) {
      query.weekStart = {};
      if (from) query.weekStart.$gte = new Date(from);
      if (to) query.weekStart.$lte = new Date(to);
    }

    const insights = await WeeklyInsight.find(query)
      .sort({ weekStart: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      insights: insights.map((insight: any) => ({
        id: insight._id.toString(),
        weekStart: insight.weekStart,
        summaryText: insight.summaryText,
        topThemes: insight.topThemes,
        topStressors: insight.topStressors,
        positives: insight.positives,
        createdAt: insight.createdAt,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching weekly insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

