// Shared validators for form submissions. Used both client-side
// (DemoModal, ContactClient, ApiDocsClient) and server-side (api routes)
// so the rules stay in sync.

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
