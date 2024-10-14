import { STRIPE_SECRET_KEY } from "$env/static/private";
import Stripe from "stripe";
import { doc, getDoc } from "firebase/firestore";
import { db } from "$lib/firebase";

const stripe = new Stripe(STRIPE_SECRET_KEY); // Use the env variable here

/** @type {import('./$types').RequestHandler} */
export async function POST({ request }) {
  try {
    const { workspaceId, customerId } = await request.json(); // Parse body

    // Retrieve workspace data from Firebase
    const workSpaceRef = doc(db, `workspaces/${workspaceId}`);
    const workSpace = await getDoc(workSpaceRef);
    const workSpaceData = workSpace.data();

    if (!workSpace.exists()) {
      throw new Error("Workspace not found");
    }

    const isTrial = workSpaceData.is_trial && workSpaceData.is_trial === true;

    if (isTrial) {
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
          JSON.stringify({ active: true, days_left: remainingTrialDays }),
          { status: 200 }
        );
      }
    }

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
        JSON.stringify({ active: true, days_left: remainingDays }),
        { status: 200 }
      );
    }

    return new Response(JSON.stringify({ active: false, days_left: 0 }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
