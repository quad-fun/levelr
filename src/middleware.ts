import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Only apply basic auth to the analyze page and Claude API for MVP protection
  const isProtectedPath = request.nextUrl.pathname === '/analyze' || 
                         request.nextUrl.pathname.startsWith('/api/claude');

  if (!isProtectedPath) {
    return NextResponse.next();
  }

  // Check for basic auth
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return new NextResponse('Authentication required', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Levelr MVP"',
      },
    });
  }

  // Decode and verify credentials
  const encodedCredentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
  const [username, password] = credentials.split(':');

  // MVP Basic Auth - use environment variables for credentials
  const validUsername = process.env.BASIC_AUTH_USER || 'powerbid';
  const validPassword = process.env.BASIC_AUTH_PASSWORD || 'demo2024';

  // Special Shorewood credentials for backdoor access
  const isShorewordCredentials = username === 'shorewood' && password === 'shorewood2025';

  if ((username !== validUsername || password !== validPassword) && !isShorewordCredentials) {
    return new NextResponse('Invalid credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Levelr MVP"',
      },
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/analyze', '/api/claude'],
};