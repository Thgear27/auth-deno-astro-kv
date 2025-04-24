import { defineMiddleware } from "astro:middleware";
import { validateSessionToken } from "../auth/session";
import {
  deleteSessionTokenCookie,
  getSessionTokenCookie,
  setSessionTokenCookie,
} from "../auth/cookie";
import { getActionContext } from "astro:actions";
import type { APIContext } from "astro";

async function handleAction(context: APIContext) {
  const { action, setActionResult, serializeActionResult } = getActionContext(context);
  if (action?.calledFrom === "form") {
    const result = await action.handler();

    setActionResult(action.name, serializeActionResult(result));

    if (result.error) {
      return false;
    }

    return true;
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const token = getSessionTokenCookie(context);
  if (token === null) {
    context.locals.user = null;
    context.locals.session = null;

    const error = await handleAction(context);
    if (error) return context.redirect(context.originPathname);
    return next();
  }

  const { session, user } = await validateSessionToken(token);

  if (!session) {
    deleteSessionTokenCookie(context);
  } else {
    setSessionTokenCookie(context, token, session.expiresAt);
  }

  context.locals.session = session;
  context.locals.user = user;

  const error = await handleAction(context);
  if (error) return context.redirect(context.originPathname);
  return next();
});
