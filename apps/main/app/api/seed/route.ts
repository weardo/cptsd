import { NextResponse } from 'next/server';
import { seedInitialResources } from '@/lib/seedResources';

export async function POST() {
  // Guard with environment variable for safety
  if (process.env.ALLOW_SEED !== 'true') {
    return NextResponse.json({ error: 'Seeding not allowed' }, { status: 403 });
  }

  try {
    const result = await seedInitialResources();
    return NextResponse.json({
      success: true,
      message: `Seeded ${result.inserted} new resources, updated ${result.updated} existing resources`,
    });
  } catch (error) {
    console.error('Error seeding resources:', error);
    return NextResponse.json(
      { error: 'Failed to seed resources', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

