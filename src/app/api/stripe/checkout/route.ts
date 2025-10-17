import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import Stripe from 'stripe';

// Only initialize Stripe if the secret key is provided (growth rails)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured (growth rails)
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe not configured - MVP mode' },
        { status: 501 }
      );
    }

    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { successUrl, cancelUrl } = await request.json();

    // Get user info for customer creation
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    // Get Pro price ID from environment
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_PRO;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Pro price ID not configured' },
        { status: 500 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${request.nextUrl.origin}/profile?success=true`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/profile?cancelled=true`,
      customer_email: userEmail,
      metadata: {
        userId,
        source: 'levelr_pro_upgrade'
      },
      subscription_data: {
        metadata: {
          userId,
          source: 'levelr_pro_upgrade'
        }
      },
      customer_creation: 'always'
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';