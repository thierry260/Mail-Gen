// src/routes/+layout.js
import { auth } from "$lib/firebase";
import { getAuth } from "firebase/auth";
import { redirect } from "@sveltejs/kit";
export const ssr = false;

export async function load({ url }) {
  const auth = getAuth();
  const user = auth.currentUser;

  if (
    !user &&
    !url.pathname.startsWith("/login") &&
    !url.pathname.startsWith("/get-mailgen")
  ) {
    console.log(auth, auth.currentUser);
    // throw redirect(302, "/login");
  }

  return { user };
}
