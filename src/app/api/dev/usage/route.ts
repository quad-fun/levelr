import { auth } from "@clerk/nextjs/server";
import { getUserUsageInfo, resetUserUsage } from "@/lib/usage";
import { getUserTier } from "@/lib/pricing";
import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const tier = await getUserTier(userId);
    const usageInfo = await getUserUsageInfo(userId, tier);

    return NextResponse.json({
      userId,
      usageInfo,
      actions: {
        reset: '/api/dev/usage/reset',
        increment: '/api/dev/usage/increment'
      }
    });
  } catch (error) {
    console.error('Failed to get usage info:', error);
    return NextResponse.json(
      { error: 'Failed to get usage info' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await resetUserUsage(userId);
    const tier = await getUserTier(userId);
    const usageInfo = await getUserUsageInfo(userId, tier);

    return NextResponse.json({
      success: true,
      message: 'Usage reset successfully',
      usageInfo
    });
  } catch (error) {
    console.error('Failed to reset usage:', error);
    return NextResponse.json(
      { error: 'Failed to reset usage' },
      { status: 500 }
    );
  }
}