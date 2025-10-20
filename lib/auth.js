import { supabase } from "./supabaseClient.js";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) console.warn("getSession error:", error);
  return data?.session ?? null;
}

export async function getUser() {
  const s = await getSession();
  return s?.user ?? null;
}

export async function requireUser(redirect = "/access-denied.html") {
  const user = await getUser();
  if (!user) {
    const next = encodeURIComponent(location.pathname + location.search + location.hash);
    location.href = `${redirect}?next=${next}`;
    throw new Error("AUTH_REQUIRED");
  }
  return user;
}

export async function signOutAndRedirect(path = "/index.html") {
  try { await supabase.auth.signOut(); } catch {}
  location.href = path;
}

// Back-compat for old global usage
window.Auth = window.Auth || { getSession, getUser, requireUser, signOutAndRedirect };
