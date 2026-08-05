import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/settings', req.url));
}
