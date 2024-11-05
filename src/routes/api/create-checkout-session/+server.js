import Stripe from "stripe";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase"; // Update this based on your configuration

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  console.log("ENV KEY: ", process.env.VITE_STRIPE_SECRET_KEY);
  try {
    const { priceId, email, workspaceId, userId } = await request.json();

    const customer = await stripe.customers.create({ email });
    const customerId = customer.id;

    await updateDoc(doc(db, `workspaces/${workspaceId}`), {
      [`users.${userId}`]: { stripeCustomerId: customerId },
    });

    // Calculate the trial end date (14 days from now)
    const trialEnd = Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60; // 14 days in seconds

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card", "ideal"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `http://app.mailgen.nl/settings?tab=subscription&payment=success&cid=${customerId}`,
      cancel_url: `http://app.mailgen.nl/settings?tab=subscription&payment=cancel`,
      subscription_data: {
        trial_end: Math.floor(Date.now() / 1000) + 14 * 24 * 60 * 60 + 60, // 14 days in seconds
      },
    });

    if (!session || !session.id) {
      throw new Error(
        "Failed to create Stripe session or session ID is missing"
      );
    }

    return new Response(JSON.stringify({ sessionId: session.id, customerId }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
