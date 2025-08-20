import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { getBaseUrl } from "@/lib/utils";
import { headers } from "next/headers";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});
export async function POST(req: NextRequest) {
  const { organizationId } = await req.json();

  const org = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  let customerId = org.stripeCustomerId ?? undefined;
  if (!customerId) {
    const c = await stripe.customers.create({ name: org.name, metadata: { organizationId } });
    customerId = c.id;
    await prisma.organization.update({
      where: { id: organizationId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: organizationId,
    line_items: [{ price: process.env.STRIPE_PRICE_TEAM_PRO_MONTHLY!, quantity: 1 }],
    success_url: `${getBaseUrl(await headers())}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getBaseUrl(await headers())}/dashboard`,
  });

  return NextResponse.json({ url: session.url });
}
