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

    console.log("check sub data: ", data);

    return {
      active: data.active || false,
      daysLeft: data.days_left || 0,
      isTrial: data.is_trial || 0,
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

        // Send "Subscription purchased" event if redirected from Stripe
        if (url.searchParams.get("cid")) {
          sendFacebookConversionEvent(
            currentUser.email,
            "Subscription purchased"
          );
        }
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

async function sendFacebookConversionEvent(
  email,
  eventName = "Free trial started"
) {
  const pixelId = "579307274634676";
  const accessToken =
    "EAAMupE49C7wBOZBNDTowDaMfQU6K0ICMeOQKDB5HFOWSPDqStqvpXQrXz1IugnhL8Vfs18DCFutE2QdNwHzURvOTqxBx8lsCEESpZCByUuJBitN5ZCsZAP1880iXkoVwt9WyaTVkex8zB20uzFzZCXDXbbtqhZCWzOFYcWiudTPTlUqZAudp5XVUL8lKYaRwLHjHQZDZD";
  const apiVersion = "v21.0";
  const url = `https://graph.facebook.com/${apiVersion}/${pixelId}/events?access_token=${accessToken}`;

  try {
    const sanitizedEmail = email?.toLowerCase().trim();
    if (!sanitizedEmail) {
      console.warn("Email is required to send the Facebook conversion event.");
      return;
    }
    const hashedEmail = await sha256Hash(sanitizedEmail);
    const clientUserAgent = navigator?.userAgent || "unknown";
    const userData = { em: hashedEmail, client_user_agent: clientUserAgent };

    const eventPayload = {
      data: [
        {
          action_source: "website",
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          user_data: userData,
        },
      ],
      test_event_code: "TEST42964",
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(eventPayload),
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      console.error("Error sending Facebook event:", errorMessage);
    } else {
      const responseBody = await response.json();
      console.log("Facebook event sent successfully:", responseBody);
    }
  } catch (error) {
    console.error("Error in Facebook conversion event function:", error);
  }
}

async function sha256Hash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
