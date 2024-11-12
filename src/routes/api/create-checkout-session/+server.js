import Stripe from "stripe";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase"; // Update this based on your configuration

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  console.log("ENV KEY: ", process.env.VITE_STRIPE_SECRET_KEY);
  try {
    const { priceId, email, workspaceId, userId, trialDaysLeft } =
      await request.json();

    const customer = await stripe.customers.create({ email });
    const customerId = customer.id;

    await updateDoc(doc(db, `workspaces/${workspaceId}`), {
      stripeCustomerId: customerId,
    });

    const sessionData = {
      customer: customerId,
      payment_method_types: ["card", "ideal"],
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `http://app.mailgen.nl/settings?tab=subscription&payment=success&cid=${customerId}`,
      cancel_url: `http://app.mailgen.nl/settings?tab=subscription&payment=cancel`,
      subscription_data: {},
    };

    // Calculate the remaining seconds of today
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); // Set to the last millisecond of the current day
    const remainingSecondsToday = Math.floor((endOfDay - now) / 1000); // Time left in seconds

    // Only add trial_end if trialDaysLeft is greater than zero
    if (trialDaysLeft > 0) {
      const trialEndTime =
        Math.floor(Date.now() / 1000) +
        remainingSecondsToday +
        trialDaysLeft * 24 * 60 * 60 +
        60;
      sessionData.subscription_data.trial_end = trialEndTime;
    }

    const session = await stripe.checkout.sessions.create(sessionData);

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
