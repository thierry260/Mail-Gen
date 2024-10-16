// src/routes/+layout.js
import { auth } from "$lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { browser } from "$app/environment";
import { user } from "$lib/stores/user";

export const ssr = false;

const checkSubscription = async (id) => {
  const workspace = localStorage.getItem("workspace");
  console.log("ID: ", id);
  try {
    const response = await fetch(
      `${window.location.origin}/api/check-subscription`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workspaceId: workspace, customerId: id }),
      }
    );
    console.log("DAYSLEFT", id);

    const data = await response.json();

    console.log("data: ", data);

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
    let subscriptionIsTrial = false;

    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
        window.location.hostname === "[::1]" ||
        window.location.hostname.match(
          /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        )
    );

    // Check if testMode exists in localStorage and is set to "true"
    const localStorageTestMode = localStorage.getItem("testMode") === "true";

    console.log("localStorageTestMode: ", localStorageTestMode);

    // Use test mode if it's either localhost or testMode is set in localStorage
    let testmode = isLocalhost || localStorageTestMode;

    if (testmode) {
      subscriptionActive = true;
      subscriptionDaysLeft = 29;
      subscriptionIsTrial = true;
      console.log("access granted by test mode");
    } else {
      const stripeCustomerId =
        localStorage.getItem("stripeCustomerId") || "null";
      const subscriptionData = await checkSubscription(stripeCustomerId);
      subscriptionActive = subscriptionData.active;
      subscriptionDaysLeft = subscriptionData.days_left;
      subscriptionIsTrial = subscriptionData.is_trial;

      console.log({ subscriptionActive, subscriptionDaysLeft });
    }

    // Ensure the auth state listener is set up
    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        // Update the user store with user info, subscription status, and days left
        user.set({
          ...currentUser,
          subscriptionActive,
          subscriptionDaysLeft,
          subscriptionIsTrial,
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
