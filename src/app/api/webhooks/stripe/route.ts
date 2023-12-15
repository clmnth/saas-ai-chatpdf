import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import { headers } from "next/headers";
import type Stripe from "stripe";

export async function POST(request: Request) {
  // Extract the body and signature from the incoming request
  const body = await request.text();
  const signature = headers().get("Stripe-Signature") ?? "";

  let event: Stripe.Event;

  try {
    // Construct the Stripe event using the provided body and signature,
    // using the Stripe webhook secret from environment variables
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    // In case of an error (e.g., verification failure), return a 400 response
    return new Response(
      `Webhook Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 400 }
    );
  }

  // Extract the session data from the event
  const session = event.data.object as Stripe.Checkout.Session;

  // Check if the session includes a userId, if not, return a 200 response
  if (!session?.metadata?.userId) {
    return new Response(null, {
      status: 200,
    });
  }

  // Handle 'checkout.session.completed' event type
  if (event.type === "checkout.session.completed") {
    // Retrieve the subscription details from Stripe using the session info
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update the user in the database with Stripe subscription details
    await db.user.update({
      where: {
        id: session.metadata.userId,
      },
      data: {
        stripeSubscriptionId: subscription.id,
        stripeCustomerId: subscription.customer as string,
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  // Handle 'invoice.payment_succeeded' event type
  if (event.type === "invoice.payment_succeeded") {
    // Retrieve the subscription details from Stripe.
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    );

    // Update the user in the database with the latest subscription details
    await db.user.update({
      where: {
        stripeSubscriptionId: subscription.id,
      },
      data: {
        stripePriceId: subscription.items.data[0]?.price.id,
        stripeCurrentPeriodEnd: new Date(
          subscription.current_period_end * 1000
        ),
      },
    });
  }

  // Return a 200 response to indicate successful handling of the webhook
  return new Response(null, { status: 200 });
}
