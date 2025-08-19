import { Prisma } from "@prisma/client";
import { db } from "../db";
import Stripe from "stripe";

export async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriptionId = subscription.id;
  const status = subscription.status;

  const orgRes = await fetch("/api/organization");
  const org = await orgRes.json();

  if (!org) {
    console.error("Organization not found for Stripe customer:", customerId);
    return;
  }

  const plan = subscription.items.data[0]?.plan;
  await db.subscription.update({
    where: { id: org.id },
    data: { stripeSubscriptionId: subscriptionId, planName: plan?.product as string, status },
  });
}