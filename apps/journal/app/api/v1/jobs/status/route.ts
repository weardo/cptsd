import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@cptsd/db/mongodb';
import { Job, JobType, JobStatus } from '@cptsd/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as JobType | null;

    await connectDB();

    const query: any = { userId: userId as any };
    if (type) {
      query.type = type;
    }

    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    const stats = {
      pending: await Job.countDocuments({ ...query, status: JobStatus.PENDING }),
      running: await Job.countDocuments({ ...query, status: JobStatus.RUNNING }),
      done: await Job.countDocuments({ ...query, status: JobStatus.DONE }),
      failed: await Job.countDocuments({ ...query, status: JobStatus.FAILED }),
    };

    return NextResponse.json({
      jobs: jobs.map((job: any) => ({
        id: job._id.toString(),
        type: job.type,
        status: job.status,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        lastError: job.lastError,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        runAt: job.runAt,
      })),
      stats,
    });
  } catch (error: any) {
    console.error('Error fetching job status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



