// src/routes/+layout.js
import { auth } from "$lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { browser } from "$app/environment";
import { user } from "$lib/stores/user";

export const ssr = false;

const checkSubscription = async (id) => {
  try {
    const response = await fetch("http://localhost:3000/check-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });
    console.log("DAYSLEFT", id);

    const data = await response.json();
    return {
      active: data.active || false,
      daysLeft: data.days_left || 0,
    };
  } catch (err) {
    console.error("Error checking subscription:", err.message);
    return { active: false, daysLeft: 0 };
  }
};

export async function load({ url }) {
  if (browser) {
    let subscriptionActive = false;
    let subscriptionDaysLeft = 0;

    const stripeCustomerId = localStorage.getItem("stripeCustomerId");

    // If stripeCustomerId exists, check subscription status
    if (stripeCustomerId) {
      const subscriptionData = await checkSubscription(stripeCustomerId);
      subscriptionActive = subscriptionData.active;
      subscriptionDaysLeft = subscriptionData.daysLeft;
    }

    // Ensure the auth state listener is set up
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Update the user store with user info, subscription status, and days left
        user.set({
          ...currentUser,
          subscriptionActive,
          subscriptionDaysLeft
        });
      } else {
        user.set(null);
      }

      // Redirect to login if the user is not authenticated and is on a protected route
      if (
        !currentUser &&
        !url.pathname.startsWith("/login") &&
        !url.pathname.startsWith("/get-mailgen")
      ) {
        window.location.href = "/login";
      }
    });
  }

  return { user: auth.currentUser || null };
}
