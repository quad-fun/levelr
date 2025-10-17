import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { setUserTier } from '@/lib/pricing';

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 501 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No Stripe signature found' },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log('Checkout session completed:', session.id);

        // Get userId from session metadata
        const userId = session.metadata?.userId;
        if (!userId) {
          console.error('No userId found in session metadata:', session.id);
          return NextResponse.json(
            { error: 'No userId in session metadata' },
            { status: 400 }
          );
        }

        // Update user tier to "pro"
        await setUserTier(userId, 'pro');

        console.log(`✅ User ${userId} upgraded to Pro tier`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        console.log('Subscription cancelled:', subscription.id);

        // Get userId from subscription metadata
        const userId = subscription.metadata?.userId;
        if (userId) {
          // Downgrade user back to starter
          await setUserTier(userId, 'starter');
          console.log(`⬇️ User ${userId} downgraded to Starter tier`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;

        console.log('Payment failed for invoice:', invoice.id);

        // Could implement grace period logic here
        // For now, we'll just log it
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';