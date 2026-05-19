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
 *
 * `topic` and `topicLabel` are optional — they ride along from the
 * topic chip selector in DemoModal to give sales context on the lead.
 * Length-capped to prevent payload stuffing, but never marked required
 * so older clients that don't send them still pass validation.
 */
export function validateDemo(form) {
  const errors = {};
  const checks = [
    ["name", "Name", 100, true],
    ["email", "Email", 200, true],
    ["company", "Company", 200, true],
    ["warehouseSize", "Warehouse size", 200, true],
    ["comments", "Comments", 2000, true],
    ["topic", "Topic", 50, false],
    ["topicLabel", "Topic label", 100, false],
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
 * Validate the contact form. Matches the fields the form actually
 * collects: name + email + message are required; company, role, and
 * usage (stage) are optional context. (Previously required a
 * non-existent "subject" field, which silently blocked all submits.)
 */
export function validateContact(form) {
  const errors = {};
  const checks = [
    ["name", "Name", 100, true],
    ["email", "Email", 200, true],
    ["company", "Company", 200, false],
    ["role", "Role", 100, false],
    ["usage", "Stage", 100, false],
    ["message", "Message", 5000, true],
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
