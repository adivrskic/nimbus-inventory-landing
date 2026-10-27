// Shared validators for form submissions. Used both client-side
// (DemoModal, ContactClient, the calculator's estimate email, the
// floor-plan form, the footer notify form) and server-side (api routes)
// so the rules stay in sync. Length caps come from FIELD_CAPS in lib/site
// — the same numbers the routes use when they store/forward a field — so
// the validator can never accept something the route then truncates.

import { FIELD_CAPS } from "./site";

// Single source of truth for email shape, imported by the chat tool
// handlers too so all three entry points (contact, demo, chat lead) accept
// exactly the same set of addresses. Tighten it here and it tightens
// everywhere.
export const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function required(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return `${label} is required.`;
  }
  return null;
}

export function maxLen(value, label, max) {
  if (typeof value === "string" && value.length > max) {
    return `${label} must be ${max} characters or fewer.`;
  }
  return null;
}

export function email(value) {
  if (!EMAIL_RE.test(String(value || "").trim())) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validateDemo(form) {
  const errors = {};
  const checks = [
    ["name", "Name", FIELD_CAPS.name, true],
    ["email", "Email", FIELD_CAPS.email, true],
    ["company", "Company", FIELD_CAPS.company, true],
    ["warehouseSize", "Warehouse size", FIELD_CAPS.warehouseSize, true],
    /* Optional — the demo form labels it "Anything else? (optional)". It
       used to be required here, so every request without a note failed
       validation, in the modal and at /api/demo, and was never sent. */
    ["comments", "Comments", FIELD_CAPS.comments, false],
    ["topic", "Topic", FIELD_CAPS.topic, false],
    ["topicLabel", "Topic label", FIELD_CAPS.topicLabel, false],
  ];

  for (const [key, label, max, isRequired] of checks) {
    const val = form[key];
    if (isRequired) {
      const r = required(val, label);
      if (r) {
        errors[key] = r;
        continue;
      }
    }
    const m = maxLen(val, label, max);
    if (m) {
      errors[key] = m;
      continue;
    }
  }

  if (!errors.email) {
    const e = email(form.email);
    if (e) errors.email = e;
  }

  return errors;
}

export function validateContact(form) {
  const errors = {};
  const checks = [
    ["name", "Name", FIELD_CAPS.name, true],
    ["email", "Email", FIELD_CAPS.email, true],
    ["company", "Company", FIELD_CAPS.company, false],
    ["role", "Role", FIELD_CAPS.role, false],
    ["usage", "Stage", FIELD_CAPS.usage, false],
    ["message", "Message", FIELD_CAPS.message, true],
  ];

  for (const [key, label, max, isRequired] of checks) {
    const val = form[key];
    if (isRequired) {
      const r = required(val, label);
      if (r) {
        errors[key] = r;
        continue;
      }
    }
    const m = maxLen(val, label, max);
    if (m) {
      errors[key] = m;
      continue;
    }
  }

  if (!errors.email) {
    const e = email(form.email);
    if (e) errors.email = e;
  }

  return errors;
}

export function validateWaitlist(form) {
  const errors = {};
  const r = required(form.email, "Email");
  if (r) {
    errors.email = r;
    return errors;
  }
  const m = maxLen(form.email, "Email", FIELD_CAPS.email);
  if (m) {
    errors.email = m;
    return errors;
  }
  const e = email(form.email);
  if (e) errors.email = e;
  return errors;
}

/* Lists /api/waitlist accepts, with the label the notification email uses.
   "api" is the original API early-access list; "mobile_apps" is the
   notify-me form under the footer's coming-soon store badges. */
export const WAITLIST_LISTS = Object.freeze({
  api: "API early access",
  mobile_apps: "Mobile app launch",
});

/* "Email me this estimate" on /calculator. Only the address and the four
   numeric inputs are accepted — the server recomputes the estimate itself. */
export function validateEstimate(form) {
  const errors = validateWaitlist({ email: form?.email });
  const inputs = form?.inputs || {};
  for (const key of ["size", "pickers", "accuracy", "wage"]) {
    if (inputs[key] === undefined || !Number.isFinite(Number(inputs[key]))) {
      errors.inputs = "The estimate inputs are missing.";
      break;
    }
  }
  return errors;
}

/* Text fields of the /floor-plan review request. The file itself is checked
   in the route (type sniffing and size need the bytes). */
export function validateFloorPlan(form) {
  const errors = {};
  const checks = [
    ["name", "Name", FIELD_CAPS.name, true],
    ["email", "Email", FIELD_CAPS.email, true],
    ["company", "Company", FIELD_CAPS.company, false],
    ["notes", "Notes", FIELD_CAPS.notes, false],
  ];

  for (const [key, label, max, isRequired] of checks) {
    const val = form[key];
    if (isRequired) {
      const r = required(val, label);
      if (r) {
        errors[key] = r;
        continue;
      }
    }
    const m = maxLen(val, label, max);
    if (m) {
      errors[key] = m;
      continue;
    }
  }

  if (!errors.email) {
    const e = email(form.email);
    if (e) errors.email = e;
  }

  return errors;
}
