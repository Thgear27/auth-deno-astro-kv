import type { APIContext } from "astro";
import type { ActionAPIContext } from "astro:actions";

type Context = APIContext | ActionAPIContext;

export function setSessionTokenCookie(context: Context, token: string, expiresAt: Date) {
  context.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    expires: expiresAt,
    path: "/",
  });
}

export function deleteSessionTokenCookie(context: Context) {
  context.cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: import.meta.env.PROD,
    maxAge: 0,
    path: "/",
  });
}

export function getSessionTokenCookie(context: Context) {
  const token = context.cookies.get("session");
  if (!token) return null;
  return token.value;
}
