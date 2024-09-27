export const switchMobileNav = (tab = "browse") => {
  const element = document.querySelector(`[name="nav"]#${tab}`);

  if (element) {
    element.checked = true;

    // Create a new 'change' event
    const event = new Event("change", {
      bubbles: true, // allows the event to bubble up through the DOM
      cancelable: true, // allows the event to be canceled
    });

    // Dispatch the event
    element.dispatchEvent(event);
  }
};
