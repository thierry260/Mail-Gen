import Stripe from "stripe";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "$lib/firebase"; // Adjust this based on your configuration

const stripe = new Stripe(process.env.VITE_STRIPE_SECRET_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { workspaceId, userId, customerId, userEmail } = await request.json();

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

    // Remove the stripeCustomerId field
    await updateDoc(doc(db, `workspaces/${workspaceId}`), {
      stripeCustomerId: null,
    });

    if (userEmail) {
      // Send Facebook Conversion Event for cancellation
      await sendFacebookConversionEvent(userEmail);
    } else {
      console.log("invalid userEmail: ", userEmail);
    }

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

// Facebook Conversion Event function for subscription cancellation
async function sendFacebookConversionEvent(email) {
  const pixelId = "579307274634676";
  const accessToken =
    "EAAMupE49C7wBOZBNDTowDaMfQU6K0ICMeOQKDB5HFOWSPDqStqvpXQrXz1IugnhL8Vfs18DCFutE2QdNwHzURvOTqxBx8lsCEESpZCByUuJBitN5ZCsZAP1880iXkoVwt9WyaTVkex8zB20uzFzZCXDXbbtqhZCWzOFYcWiudTPTlUqZAudp5XVUL8lKYaRwLHjHQZDZD";
  const apiVersion = "v21.0";
  const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const sanitizedEmail = email.toLowerCase().trim();
    const hashedEmail = await sha256Hash(sanitizedEmail);

    const eventPayload = {
      data: [
        {
          action_source: "website",
          event_name: "Subscription canceled",
          event_time: Math.floor(Date.now() / 1000),
          user_data: { em: hashedEmail },
        },
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error("Error sending Facebook event:", errorMessage);
    } else {
      console.log("Facebook 'Subscription Canceled' event sent successfully.");
    }
  } catch (error) {
    console.error("Error in Facebook conversion event function:", error);
  }
}

// Helper to hash email with SHA-256
async function sha256Hash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
