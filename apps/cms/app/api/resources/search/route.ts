import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Resource } from '@cptsd/db';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    const resources = await Resource.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
      ],
    })
      .select('title description url type category')
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      resources: resources.map((resource) => ({
        id: resource._id.toString(),
        title: resource.title,
        description: resource.description || null,
        url: resource.url || null,
        type: resource.type,
        category: resource.category,
      })),
    });
  } catch (error) {
    console.error('Error searching resources:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search resources',
        resources: [],
      },
      { status: 500 }
    );
  }
}

