export const switchMobileNav = (tab = "browse") => {
  const element = document.querySelector(`[name="nav"]#${tab}`);

  console.log("element", element);

  if (element) {
    console.log("element found");
    // Element is visible if its offsetParent is not null
    element.checked = true;
    console.log(`document.querySelector("[name='nav']#${tab}")`, "checked");
  }
};
