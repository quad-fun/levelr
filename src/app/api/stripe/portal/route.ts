import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  try {
    // Check if Stripe is configured
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

    const { returnUrl } = await request.json();

    // First, we need to find the customer by metadata or email
    // In a real app, you'd store the Stripe customer ID with the user
    // For now, we'll search for customers with this userId in metadata
    const customers = await stripe.customers.list({
      limit: 100
    });

    // Filter customers by userId in metadata
    const userCustomers = customers.data.filter(customer =>
      customer.metadata?.userId === userId
    );

    let customerId: string;

    if (userCustomers.length > 0) {
      customerId = userCustomers[0].id;
    } else {
      // If no customer found, they might not have subscribed yet
      return NextResponse.json(
        { error: 'No subscription found. Please upgrade to Pro first.' },
        { status: 404 }
      );
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${request.nextUrl.origin}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Portal session error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Portal creation failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';