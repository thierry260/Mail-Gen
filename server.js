import express from 'express';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './src/lib/firebase.js'; // Adjust import based on your firebase configuration



dotenv.config(); // Load environment variables

const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post('/create-checkout-session', async (req, res) => {
    const { priceId, email, workspaceId, userId } = req.body;

    try {
        // Log request details to ensure all necessary data is passed
        console.log("Received priceId:", priceId);
        console.log("Received email:", email);
        console.log("Received workspaceId:", workspaceId);
        console.log("Received userId:", userId);

        // Create or fetch customer in Stripe
        const customer = await stripe.customers.create({
            email: email,
        });
        const customerId = customer.id;

        console.log("Created Customer:", customerId);

        // Save customerId in Firebase under the correct user's record in the workspace
        try {
            const workspaceDocRef = doc(db, `workspaces/${workspaceId}`);
            await updateDoc(workspaceDocRef, {
                [`users.${userId}`]: {
                    stripeCustomerId: customerId
                }
            });
            console.log("Successfully saved customerId to Firebase.");
        } catch (firebaseError) {
            console.error("Error saving customerId to Firebase:", firebaseError.message);
        }

        // Create a checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types: ['card', 'ideal'],
            mode: 'subscription',
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `http://localhost:5173/settings?tab=subscription&payment=success&cid=${customerId}`,  // Placeholder URL
            cancel_url: `http://localhost:5173/settings?tab=subscription&payment=cancel&cid=${customerId}`,    // Placeholder URL
        });

        console.log("Session created:", session); // Log the entire session object

        if (!session || !session.id) {
            throw new Error('Failed to create session or session ID is missing');
        }

        res.json({ sessionId: session.id, customerId: customerId });
    } catch (error) {
        console.error("Error during session creation:", error.message);
        res.status(500).json({ error: error.message });
    }
});

app.post('/check-subscription', async (req, res) => {
    const { customerId } = req.body;

    try {
        // Fetch active subscriptions for the customer
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
        });

        if (subscriptions.data.length > 0) {
            const subscription = subscriptions.data[0];
            const remainingDays = Math.floor((new Date(subscription.current_period_end * 1000) - new Date()) / (1000 * 60 * 60 * 24));

            return res.json({
                active: true,
                days_left: remainingDays,
            });
        } else {
            return res.json({ active: false });
        }
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
});

app.post('/cancel-subscription', async (req, res) => {
    const { workspaceId, userId, customerId } = req.body;

    try {
        // Retrieve customerId from Firebase
        const userDocRef = doc(db, `workspaces/${workspaceId}`);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            throw new Error('Workspace not found');
        }

        const userData = userDoc.data().users[userId];
        // const customerId = userData?.stripeCustomerId;

        if (!customerId) {
            throw new Error('Customer ID not found');
        }

        console.log('Retrieved Customer ID:', customerId);

        // Retrieve active subscriptions for the customer
        const subscriptions = await stripe.subscriptions.list({
            customer: customerId,
            status: 'active',
        });

        if (subscriptions.data.length === 0) {
            throw new Error('No active subscriptions found');
        }

        const subscriptionId = subscriptions.data[0].id; // Assuming one active subscription
        console.log('Found subscription to cancel:', subscriptionId);

        // Cancel the subscription
        const canceledSubscription = await stripe.subscriptions.cancel(subscriptionId);
        console.log('Subscription canceled:', canceledSubscription.id);

        // Optionally update Firebase to remove or mark the stripeCustomerId as canceled
        await updateDoc(userDocRef, {
            [`users.${userId}.stripeCustomerId`]: null // Mark it as canceled or remove the field
        });

        res.json({ success: true, message: 'Subscription canceled successfully' });
    } catch (error) {
        console.error('Error canceling subscription:', error.message);
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));