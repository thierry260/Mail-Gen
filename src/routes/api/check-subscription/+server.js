import Stripe from "stripe";
import { doc, getDoc } from "firebase/firestore";
import { db } from "$lib/firebase";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { workspaceId, customerId, redirectedFromStripe } =
      await request.json();

    // Check for required fields
    if (!workspaceId || !customerId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    // Retrieve workspace data from Firebase
    const workSpaceRef = doc(db, `workspaces/${workspaceId}`);
    const workSpace = await getDoc(workSpaceRef);

    // Check if workspace exists
    if (!workSpace.exists()) {
      throw new Error("Workspace not found");
    }

    const workSpaceData = workSpace.data();
    const isTrial = workSpaceData.is_trial && workSpaceData.is_trial === true;

    // Handle trial case
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
    let subscriptions = await stripe.subscriptions.list({
      customer: customerId,
    });

    subscriptions.data = subscriptions.data.filter(
      (sub) => sub.status === "active" || sub.status === "trialing"
    );

    // return new Response(
    //   JSON.stringify({
    //     sub: subscriptions,
    //     error: "Sub data.",
    //   }),
    //   { status: 402 } // Payment Required
    // );

    // Check if any active subscriptions exist
    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];

      if (subscription.status == "trialing") {
        const trialEnd = Math.floor(
          (subscription.current_period_end * 1000 - Date.now()) /
            (1000 * 60 * 60 * 24)
        );

        if (trialEnd > 0) {
          return new Response(
            JSON.stringify({
              active: true,
              days_left: trialEnd,
              is_trial: true,
            }),
            { status: 200 }
          );
        } else {
          return new Response(
            JSON.stringify({
              active: true,
              days_left: trialEnd,
              is_trial: true,
            }),
            { status: 200 }
          );
        }
      } else {
        // Active sub

        // Calculate remaining days if payment is successful
        const remainingDays = Math.floor(
          (subscription.current_period_end * 1000 - Date.now()) /
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
    }

    // No active subscriptions found
    return new Response(
      JSON.stringify({ active: false, days_left: 0, is_trial: false }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in API endpoint:", error); // Log the error
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
