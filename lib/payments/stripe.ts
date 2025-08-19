import Stripe from "stripe";
import { getBaseUrl } from "../utils";
import { headers } from "next/headers";
import { updateTeamSubscription } from "./actions";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export async function createStripeCheckoutSession(organizationId: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price: process.env.STRIPE_TEAM_PLAN_PRICE_ID,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: `${getBaseUrl(await headers())}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl(await headers())}/dashboard`,
    client_reference_id: organizationId,
  });

  return session.url;
}
