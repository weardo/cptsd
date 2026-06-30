import { seedDefaultTemplates } from '@/app/actions/templates';
import { NextResponse } from 'next/server';

/**
 * API route to seed default prompt templates
 * GET /api/seed-templates
 */
export async function GET() {
  try {
    const result = await seedDefaultTemplates();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed templates',
      },
      { status: 500 }
    );
  }
}

