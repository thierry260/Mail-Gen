// src/routes/+layout.js
import { auth } from "$lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { browser } from "$app/environment";
import { user } from "$lib/stores/user";

export const ssr = false;

const checkSubscription = async (
  workspaceId,
  customerId,
  redirected = false
) => {
  try {
    const response = await fetch("/api/check-subscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        workspaceId,
        customerId,
        redirectedFromStripe: redirected,
      }),
    });

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
    let subscriptionIsTrial = false;

    const isLocalhost = Boolean(
      window.location.hostname === "localhost" ||
        window.location.hostname === "[::1]" ||
        window.location.hostname.match(
          /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
        )
    );

    const localStorageTestMode = localStorage.getItem("testMode") === "true";
    const testmode = isLocalhost || localStorageTestMode;

    if (testmode) {
      subscriptionActive = true;
      subscriptionDaysLeft = 29;
      subscriptionIsTrial = true;
    } else {
      const workspaceId = localStorage.getItem("workspace");

      // Check for the 'cid' URL parameter on load
      const redirectedFromStripe = url.searchParams.get("cid");
      let stripeCustomerId = localStorage.getItem("stripeCustomerId");

      if (redirectedFromStripe) {
        localStorage.setItem("stripeCustomerId", redirectedFromStripe);
        stripeCustomerId = redirectedFromStripe;
        console.log(
          `redirectedFromStripe - stripeCustomerId set to ${redirectedFromStripe}`
        );
      }

      const subscriptionData = await checkSubscription(
        workspaceId,
        stripeCustomerId,
        Boolean(redirectedFromStripe)
      );

      console.log("checkSubscription, subscriptionData;", { subscriptionData });

      console.log("checkSubscription, params;", {
        workspaceId,
        stripeCustomerId,
        redirectedFromStripe,
      });

      subscriptionActive = subscriptionData.active;
      subscriptionDaysLeft = subscriptionData.daysLeft;
      subscriptionIsTrial = subscriptionData.isTrial; // Make sure this is returned by your API
    }

    onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        user.set({
          ...currentUser,
          subscriptionActive,
          subscriptionDaysLeft,
          subscriptionIsTrial,
        });
      } else {
        user.set(null);
      }

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
