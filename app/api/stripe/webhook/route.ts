import Stripe from "stripe";
import { stripe } from "@/lib/payments/stripe";
import { NextRequest, NextResponse } from "next/server";
import { handleSubscriptionChange } from "@/lib/payments/actions";
import { db } from "@/lib/db";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed.", err);
    return NextResponse.json({ error: "Webhook signature verification failed." }, { status: 400 });
  }

  const subscription = event.data.object as Stripe.Subscription;
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.client_reference_id; // 👈 comes from your checkout creation
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      await db.organization.update({
        where: { id: orgId },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          planName: "team", // set based on which price was bought
          status: "active",
        },
      });
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      // Look up org by stripeCustomerId
      const org = await db.organization.findUnique({
        where: { stripeCustomerId: customerId },
      });
      if (!org) {
        console.error("Org not found for customer:", customerId);
        return NextResponse.json({ error: "Org not found" }, { status: 404 });
      }

      await db.organization.update({
        where: { id: org.id },
        data: {
          stripeSubscriptionId: subscription.id,
          status: subscription.status,
        },
      });
      break;
    }

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
