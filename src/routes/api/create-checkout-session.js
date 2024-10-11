import Stripe from 'stripe';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '$lib/firebase'; // Pas dit aan op basis van jouw configuratie

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function post(req) {
    const { priceId, email, workspaceId, userId } = req.body;

    try {
        const customer = await stripe.customers.create({ email });
        const customerId = customer.id;

        await updateDoc(doc(db, `workspaces/${workspaceId}`), {
            [`users.${userId}`]: { stripeCustomerId: customerId }
        });

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card', 'ideal'],
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `https://app.mailgen.nl/settings?tab=subscription&payment=success&cid=${customerId}`,
            cancel_url: `https://app.mailgen.nl/settings?tab=subscription&payment=cancel`,
        });

        return { status: 200, body: { sessionId: session.id, customerId } };
    } catch (error) {
        return { status: 500, body: { error: error.message } };
    }
}
