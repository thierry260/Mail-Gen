import Stripe from "stripe";
import { doc, getDoc } from "firebase/firestore";
import { db } from "$lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { workspaceId, customerId, redirectedFromStripe } =
      await request.json(); // Parse body

    if (!workspaceId || !customerId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Retrieve workspace data from Firebase
    const workSpaceRef = doc(db, `workspaces/${workspaceId}`);
    const workSpace = await getDoc(workSpaceRef);

    if (!workSpace.exists()) {
      throw new Error("Workspace not found");
    }

    const workSpaceData = workSpace.data();

    const isTrial = workSpaceData.is_trial && workSpaceData.is_trial === true;

    // Handle trial case (without a stripeCustomerId)
    if (isTrial && !customerId && !redirectedFromStripe) {
      const creationDate = new Date(
        workSpaceData.created_at.seconds * 1000 +
          workSpaceData.created_at.nanoseconds / 1000000
      );

      const currentDate = new Date();
      const diffInMilliseconds = currentDate - creationDate;
      const diffInDays = Math.floor(diffInMilliseconds / (1000 * 60 * 60 * 24));

      if (diffInDays <= 14) {
        const remainingTrialDays = 14 - diffInDays;

        return new Response(
          JSON.stringify({
            active: false, // No active subscription yet
            days_left: remainingTrialDays,
            is_trial: true,
          }),
          { status: 200 }
        );
      }

      // Trial expired, no active subscription
      return new Response(
        JSON.stringify({
          active: false,
          days_left: 0,
          is_trial: false,
        }),
        { status: 200 }
      );
    }

    // If customerId exists, check Stripe subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
    });

    if (subscriptions.data.length > 0) {
      const remainingDays = Math.floor(
        (subscriptions.data[0].current_period_end * 1000 - Date.now()) /
          (1000 * 60 * 60 * 24)
      );
      return new Response(
        JSON.stringify({
          active: true,
          days_left: remainingDays,
          is_trial: false,
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ active: false, days_left: 0, is_trial: false }),
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in API endpoint:", error); // Log the error
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
