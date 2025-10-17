import { auth } from "@clerk/nextjs/server";
import { setUserTier } from "@/lib/pricing";
import { NextRequest, NextResponse } from "next/server";
import type { UserTier } from "@/lib/flags";

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tier = searchParams.get('tier') as UserTier;

  const validTiers: UserTier[] = ['starter', 'pro', 'team', 'enterprise'];

  if (!tier || !validTiers.includes(tier)) {
    return NextResponse.json(
      {
        error: 'Invalid tier',
        validTiers,
        usage: '/api/dev/set-tier?tier=pro'
      },
      { status: 400 }
    );
  }

  try {
    await setUserTier(userId, tier);

    return NextResponse.json({
      success: true,
      message: `User tier updated to: ${tier}`,
      userId,
      tier,
      redirectTo: '/dashboard'
    });
  } catch (error) {
    console.error('Failed to set user tier:', error);
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { tier } = await request.json();

    const validTiers: UserTier[] = ['starter', 'pro', 'team', 'enterprise'];

    if (!tier || !validTiers.includes(tier)) {
      return NextResponse.json(
        {
          error: 'Invalid tier',
          validTiers
        },
        { status: 400 }
      );
    }

    await setUserTier(userId, tier);

    return NextResponse.json({
      success: true,
      message: `User tier updated to: ${tier}`,
      userId,
      tier
    });
  } catch (error) {
    console.error('Failed to set user tier:', error);
    return NextResponse.json(
      { error: 'Failed to update tier' },
      { status: 500 }
    );
  }
}