import { NextResponse } from 'next/server';
import { getAuthentication } from '@/lib/server-auth';

export async function GET(request: Request) {
  const authentication = await getAuthentication(request);
  if (authentication.status === 'unavailable') {
    return NextResponse.json(
      { authenticated: false, error: '认证服务暂时不可用。' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }
  if (authentication.status !== 'authenticated') {
    return NextResponse.json(
      { authenticated: false },
      { status: 401, headers: { 'Cache-Control': 'no-store, private' } },
    );
  }

  return NextResponse.json(
    { authenticated: true, user: authentication.user },
    { headers: { 'Cache-Control': 'no-store, private' } },
  );
}
