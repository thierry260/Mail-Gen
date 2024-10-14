import { STRIPE_SECRET_KEY } from "$env/dynamic/private";
import Stripe from "stripe";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase"; // Adjust this based on your configuration

const stripe = new Stripe(STRIPE_SECRET_KEY); // Use the env variable here

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { workspaceId, userId, customerId } = await request.json();

    // Log the received data for debugging
    console.log("CANCEL DATA: ", workspaceId, userId, customerId);

    // Fetch the user document from Firestore
    const userDoc = await getDoc(doc(db, `workspaces/${workspaceId}`));

    // Check if workspace exists
    if (!userDoc.exists()) throw new Error("Workspace not found");

    // List active subscriptions for the customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    // Handle case where no active subscriptions are found
    if (subscriptions.data.length === 0)
      throw new Error("No active subscriptions found");

    // Cancel the active subscription
    const subscriptionId = subscriptions.data[0].id;
    await stripe.subscriptions.cancel(subscriptionId);

    // Mark the user as having no active subscription in Firestore
    await updateDoc(doc(db, `workspaces/${workspaceId}`), {
      [`users.${userId}.stripeCustomerId`]: null, // Remove or mark as canceled
    });

    // Return a success message
    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription canceled successfully",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error canceling subscription:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
