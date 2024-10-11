import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function post(req) {
    const { customerId } = req.body;

    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
        });

        if (subscriptions.data.length > 0) {
            const remainingDays = Math.floor((subscriptions.data[0].current_period_end * 1000 - Date.now()) / (1000 * 60 * 60 * 24));
            return { status: 200, body: { active: true, days_left: remainingDays } };
        }

        return { status: 200, body: { active: false } };
    } catch (error) {
        return { status: 500, body: { error: error.message } };
    }
}
