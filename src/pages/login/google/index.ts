import type { APIContext } from "astro";
import { generateState } from "../../../auth/outh/utils";
import { createAuthorizationURL } from "../../../auth/outh/google";

export function GET(context: APIContext): Response {
  const state = generateState();
  const url = createAuthorizationURL(state, ["openid", "profile", "email"]);

  context.cookies.set("google_oauth_state", state, {
    httpOnly: true,
    maxAge: 60 * 10,
    secure: import.meta.env.PROD,
    path: "/",
    sameSite: "lax",
  });

  return context.redirect(url.toString());
}
