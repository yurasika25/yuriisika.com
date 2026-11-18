"use strict";

if (location.pathname.endsWith("/affirmation-app/index.html")) {
  location.replace("/affirmation-app/" + location.search + location.hash);
}

const menuButton = document.querySelector("#menuBtn");
const menu = document.querySelector("#mobileMenu");
function setMenu(open) {
  menu.hidden = !open;
  menuButton.setAttribute("aria-expanded", String(open));
}
menuButton.addEventListener("click", () => setMenu(menu.hidden));
menu.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link) return;
  setMenu(false);
  const destination = document.querySelector(link.hash);
  destination.tabIndex = -1;
  destination.focus({ preventScroll: true });
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !menu.hidden) {
    setMenu(false);
    menuButton.focus();
  }
});
document.addEventListener("click", event => {
  if (!event.target.closest("header")) setMenu(false);
});
matchMedia("(min-width: 901px)").addEventListener("change", () => setMenu(false));

const viewer = document.querySelector(".viewer");
const screenLinks = document.querySelectorAll("[data-screen]");
for (const link of screenLinks) {
  link.addEventListener("click", event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    for (const item of screenLinks) item.removeAttribute("aria-current");
    link.setAttribute("aria-current", "true");
    const image = viewer.querySelector("img");
    image.src = link.href;
    image.alt = link.dataset.alt;
    viewer.querySelector("figcaption").textContent = link.firstChild.textContent;
    if (matchMedia("(max-width: 680px)").matches) viewer.scrollIntoView({ block: "start" });
  });
}

const copyButton = document.querySelector("#copyEmailBtn");
const toast = document.querySelector("#toast");
let toastTimer;
copyButton.addEventListener("click", async () => {
  const email = document.querySelector("#supportEmail").textContent.trim();
  let copied = false;
  try {
    await navigator.clipboard.writeText(email);
    copied = true;
  } catch {
    const field = document.createElement("textarea");
    field.value = email;
    field.style.position = "fixed";
    field.style.left = "-9999px";
    document.body.append(field);
    field.select();
    try { copied = document.execCommand("copy"); }
    finally { field.remove(); copyButton.focus(); }
  }
  toast.textContent = copied ? "Email copied." : "Select the email address to copy it.";
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.textContent = ""; }, 2400);
});

const form = document.querySelector("#waitlistForm");
const email = form.elements.namedItem("email");
const consent = form.elements.namedItem("consent");
const submit = document.querySelector("#waitlistSubmit");
const success = document.querySelector("#wl_status");
const failure = document.querySelector("#wl_error");

function setMetadata() {
  form.elements.namedItem("page").value = location.href;
  form.elements.namedItem("userAgent").value = navigator.userAgent;
}
function validate(field, valid) {
  field.setAttribute("aria-invalid", String(!valid));
  document.getElementById(field.getAttribute("aria-describedby")).hidden = valid;
}
setMetadata();
form.noValidate = true;
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (submit.disabled) return;
  success.textContent = failure.textContent = "";
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
  validate(email, emailValid);
  validate(consent, consent.checked);
  if (!emailValid || !consent.checked) {
    (emailValid ? consent : email).focus();
    return;
  }

  const label = submit.firstChild;
  const original = label.textContent;
  submit.disabled = true;
  label.textContent = "Joining… ";
  try {
    const response = await fetch(form.action, {
      method: "POST", headers: { Accept: "application/json" }, body: new FormData(form)
    });
    if (!response.ok) throw new Error("Waitlist request failed");
    form.reset();
    setMetadata();
    success.textContent = "You’re on the list. Thank you for joining.";
  } catch {
    failure.textContent = "We couldn’t add you this time. Please try again.";
  } finally {
    submit.disabled = false;
    label.textContent = original;
  }
});
