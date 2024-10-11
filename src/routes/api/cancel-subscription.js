import Stripe from 'stripe';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '$lib/firebase'; // Pas dit aan op basis van jouw configuratie

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function post(req) {
    const { workspaceId, userId, customerId } = req.body;
    console.log("CANCEL DATA: ", workspaceId, userId, customerId);
    try {
        const userDoc = await getDoc(doc(db, `workspaces/${workspaceId}`));

        if (!userDoc.exists()) throw new Error('Workspace not found');

        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
        });

        if (subscriptions.data.length === 0) throw new Error('No active subscriptions found');

        const subscriptionId = subscriptions.data[0].id;
        await stripe.subscriptions.cancel(subscriptionId);

        await updateDoc(doc(db, `workspaces/${workspaceId}`), {
            [`users.${userId}.stripeCustomerId`]: null // Verwijder of markeer als geannuleerd
        });

        return { status: 200, body: { success: true, message: 'Subscription canceled successfully' } };
    } catch (error) {
        return { status: 500, body: { error: error.message } };
    }
}
