import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";

// ----------------------------------------------------------------------------
// You already have src/lib/actions/auth.ts handling admin login. This file is
// for STOREFRONT customer sessions (a separate concern from admin auth) and
// doesn't touch Supabase at all — it's pure cookie/JWT, so it works today
// with no database connected.
//
// If your storefront customers end up in the same Supabase `auth.users`
// table as admins (likely, if you're using Supabase Auth), replace
// getSession()/createSession() below with calls to
// `createClient()` from src/lib/supabase/server.ts and
// `supabase.auth.getUser()` / `supabase.auth.signInWithPassword()` — the
// getOrCreateGuestToken() / mergeGuestCartIntoUser() functions don't change,
// since guest-cart identity has nothing to do with which auth provider you use.
// ----------------------------------------------------------------------------

import { db } from "./db";

const GUEST_CART_COOKIE = "deckdrop_guest_cart";

export interface SessionPayload {
  userId: string;
  email: string | null;
  role: "customer" | "staff" | "admin" | "super_admin";
}

/** Reads the same Supabase Auth session used by the login pages. */
export async function getSession(): Promise<SessionPayload | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    role: (profile?.role ?? "customer") as SessionPayload["role"],
  };
}

/** Convenience helper — throws a 401-shaped error object for route handlers to catch. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw Object.assign(new Error("UNAUTHENTICATED"), { status: 401 });
  }
  return session;
}

// ----------------------------------------------------------------------------
// Guest cart support — lets someone add to cart before Login/Sign up.
// Identified by an anonymous cookie token instead of a userId. Merges into
// the user's cart on login. This part is storage-agnostic — it'll work
// unchanged once db.ts is backed by Supabase.
// ----------------------------------------------------------------------------

export async function getOrCreateGuestToken(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(GUEST_CART_COOKIE)?.value;
  if (existing) return existing;

  const token = randomUUID();
  jar.set(GUEST_CART_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return token;
}

/** Call this from your login action right after createSession(). */
export async function mergeGuestCartIntoUser(userId: string) {
  const jar = await cookies();
  const guestToken = jar.get(GUEST_CART_COOKIE)?.value;
  if (!guestToken) return;

  const guestCart = await db.cart.findUnique({
    where: { sessionToken: guestToken },
    include: { items: { include: { product: true } } },
  });
  if (!guestCart) return;

  const userCart = await db.cart.upsert({
    where: { userId },
    create: { userId },
  });

  for (const item of (guestCart as { items: { productId: string; quantity: number; unitPriceSnapshot: number }[] }).items) {
    const existing = await db.cartItem.findUnique({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
    });
    const mergedQuantity = (existing?.quantity ?? 0) + item.quantity;

    await db.cartItem.upsert({
      where: { cartId_productId: { cartId: userCart.id, productId: item.productId } },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        quantity: mergedQuantity,
        unitPriceSnapshot: item.unitPriceSnapshot,
      },
      update: { quantity: mergedQuantity, unitPriceSnapshot: item.unitPriceSnapshot },
    });
  }

  await db.cart.delete({ where: { id: guestCart.id } });
  jar.delete(GUEST_CART_COOKIE);
}
