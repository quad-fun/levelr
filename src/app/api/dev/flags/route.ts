import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clerkClient } from '@clerk/nextjs/server';
import { getUserTier } from '@/lib/pricing';
import { getFlags } from '@/lib/flags';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user email
    let userEmail;
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      userEmail = user.emailAddresses?.[0]?.emailAddress;
    } catch (error) {
      console.warn('Failed to get user email:', error);
    }

    const tier = await getUserTier(userId);
    const flags = await getFlags({ userId, userEmail, tier, request });

    return NextResponse.json({
      userId,
      userEmail,
      tier,
      flags
    });
  } catch (error) {
    console.error('Error in flags debug endpoint:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}