import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Article, ArticleStatus } from '@cptsd/db';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '20');

    const articles = await Article.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { slug: { $regex: query, $options: 'i' } },
      ],
      status: ArticleStatus.PUBLISHED,
    })
      .select('title slug isLearnResource')
      .limit(limit)
      .sort({ publishedAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      articles: articles.map((article) => ({
        id: article._id.toString(),
        title: article.title,
        slug: article.slug,
        isLearnResource: article.isLearnResource || false,
      })),
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to search articles',
        articles: [],
      },
      { status: 500 }
    );
  }
}


