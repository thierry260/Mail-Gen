import { STRIPE_SECRET_KEY } from "$env/dynamic/private";
import Stripe from "stripe";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase"; // Update this based on your configuration

const stripe = new Stripe(STRIPE_SECRET_KEY); // Use the env variable here

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    // Parse the request body
    const { priceId, email, workspaceId, userId } = await request.json();

    // Create a new customer in Stripe using the provided email
    const customer = await stripe.customers.create({ email });
    const customerId = customer.id;

    // Update Firestore workspace with the Stripe customer ID
    await updateDoc(doc(db, `workspaces/${workspaceId}`), {
      [`users.${userId}`]: { stripeCustomerId: customerId },
    });

    // Create the checkout session for the user with a subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card", "ideal"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `https://app.mailgen.nl/settings?tab=subscription&payment=success&cid=${customerId}`,
      cancel_url: `https://app.mailgen.nl/settings?tab=subscription&payment=cancel`,
    });

    // Return the sessionId and customerId back to the client
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
