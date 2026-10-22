/* =====================================================================
   SUPABASE CONNECTION — used by the website forms AND the /admin page.

   Paste your project's values from:
     Supabase Dashboard → Project Settings → API
       • Project URL          → url
       • anon / public key    → anonKey

   The anon key is MEANT to be public. It can only call the
   submit_registration function; it cannot read any registrations.
   (Never put the "service_role" key here.)
   ===================================================================== */
window.FOXES_SUPABASE = {
  url:     "https://axhholiwqlabumecrrih.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aGhvbGl3cWxhYnVtZWNycmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI3MDY3MjYsImV4cCI6MjEwODI4MjcyNn0.mS6l9C9kGXg9zsGp8RqMDIAtii1cHQg1yqw-QT6BC_8"
};

/* ---------------------------------------------------------------------
   foxesSubmit(kind, fields, source?)
   Sends one registration to Supabase. Resolves with the new id, or
   throws an Error with a friendly message.
     kind   — 'youth' | 'tryout' | any key in the registration_kinds table
     fields — plain object (form field name → value)
   --------------------------------------------------------------------- */
window.foxesSubmit = async function (kind, fields, source) {
  const cfg = window.FOXES_SUPABASE || {};
  if (!cfg.url || cfg.url.includes("YOUR-PROJECT")) {
    throw new Error("Online registration isn't set up yet. Please contact us to register.");
  }
  const res = await fetch(cfg.url.replace(/\/$/, "") + "/rest/v1/rpc/submit_registration", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": cfg.anonKey,
      "Authorization": "Bearer " + cfg.anonKey
    },
    body: JSON.stringify({ p_kind: kind, p_data: fields, p_source: source || "website" })
  });
  if (!res.ok) {
    let msg = "Something went wrong sending your registration. Please try again.";
    try {
      const err = await res.json();
      if (err && err.message && /required|valid|Invalid|Too many/i.test(err.message)) msg = err.message;
    } catch (_) {}
    throw new Error(msg);
  }
  return res.json();
};

/* Turns a <form> into a plain object (checkboxes → their value when checked). */
window.foxesFormData = function (form) {
  const out = {};
  new FormData(form).forEach((v, k) => {
    if (k.startsWith("_")) return;            // skip leftover helper fields
    out[k] = typeof v === "string" ? v.trim() : v;
  });
  return out;
};
