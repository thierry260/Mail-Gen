// src/lib/stores/toggleSwitchStore.js
import { writable } from "svelte/store";

// Initialize from localStorage or set to false if not present
const initialValue = localStorage.getItem("showTemplateContent") === "true";

export const showContent = writable(initialValue);

// Subscribe to the store and update localStorage whenever the value changes
showContent.subscribe((value) => {
  localStorage.setItem("showTemplateContent", value);
});
