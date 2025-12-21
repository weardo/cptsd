import { NextResponse } from 'next/server';
import { initializeAdminUser } from '@/lib/init-admin';

export async function GET() {
  try {
    await initializeAdminUser();
    return NextResponse.json({ status: 'ok', message: 'Initialized' });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}



