import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import connectDB from '@cptsd/db/mongodb';
import { JournalMessage } from '@cptsd/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const conversationId = searchParams.get('conversationId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    if (!conversationId) {
      return NextResponse.json({ error: 'conversationId is required' }, { status: 400 });
    }

    await connectDB();

    const messages = await JournalMessage.find({
      conversationId,
      userId: userId as any,
    })
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await JournalMessage.countDocuments({
      conversationId,
      userId: userId as any,
    });

    return NextResponse.json({
      messages: messages.map((msg) => ({
        id: msg._id.toString(),
        role: msg.role,
        content: msg.content,
        createdAt: msg.createdAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

