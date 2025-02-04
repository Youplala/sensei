import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ensureGameInitialized } from './lib/globalSetup';
 
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/')) {
    try {
      await ensureGameInitialized();
    } catch (error) {
      console.error('Middleware initialization error:', error);
      return NextResponse.json(
        { error: 'Failed to initialize game' },
        { status: 500 }
      );
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
}
