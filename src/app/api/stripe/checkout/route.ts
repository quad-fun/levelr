import { NextRequest, NextResponse } from 'next/server';
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
    
    const { email, priceId, successUrl, cancelUrl } = await request.json();

    if (!email || !priceId) {
      return NextResponse.json(
        { error: 'Email and price ID are required' },
        { status: 400 }
      );
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: email,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl || `${request.nextUrl.origin}/analyze?upgraded=true`,
      cancel_url: cancelUrl || `${request.nextUrl.origin}/pricing?cancelled=true`,
      metadata: {
        email,
        source: 'powerbid_mvp'
      },
      subscription_data: {
        metadata: {
          email,
          source: 'powerbid_mvp'
        }
      }
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