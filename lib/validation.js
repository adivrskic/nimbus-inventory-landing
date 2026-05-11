// lib/validation.js
// Shared validators for form submissions. Used both client-side
// (DemoModal, ContactClient, ApiDocsClient) and server-side (api routes)
// so the rules stay in sync.

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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

/**
 * Validate the demo form. Returns an object keyed by field name with
 * error messages. An empty object means the form is valid.
 */
export function validateDemo(form) {
  const errors = {};
  const checks = [
    ["name", "Name", 100, true],
    ["email", "Email", 200, true],
    ["company", "Company", 200, true],
    ["warehouseSize", "Warehouse size", 200, true],
    ["comments", "Comments", 2000, true],
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

/**
 * Validate the contact form. Same shape as validateDemo.
 */
export function validateContact(form) {
  const errors = {};
  const checks = [
    ["name", "Name", 100, true],
    ["email", "Email", 200, true],
    ["subject", "Subject", 200, true],
    ["message", "Message", 2000, true],
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

/**
 * Validate the API waitlist form (single email field).
 */
export function validateWaitlist(form) {
  const errors = {};
  const r = required(form.email, "Email");
  if (r) {
    errors.email = r;
    return errors;
  }
  const m = maxLen(form.email, "Email", 200);
  if (m) {
    errors.email = m;
    return errors;
  }
  const e = email(form.email);
  if (e) errors.email = e;
  return errors;
}
