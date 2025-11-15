import { initAdminUser } from '@/lib/init-admin';
import { NextResponse } from 'next/server';

/**
 * API route to initialize admin user
 * GET /api/init
 */
export async function GET() {
  try {
    const user = await initAdminUser();
    return NextResponse.json({
      success: true,
      message: 'Admin user initialized',
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to initialize admin user',
      },
      { status: 500 }
    );
  }
}
