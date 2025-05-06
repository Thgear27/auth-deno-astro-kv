export function getGoogleClientId() {
  const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
  if (!clientId) {
    throw new Error("GOOGLE_CLIENT_ID is not set");
  }
  return clientId;
}

export function getGoogleClientSecret() {
  const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
  if (!clientSecret) {
    throw new Error("GOOGLE_CLIENT_SECRET is not set");
  }
  return clientSecret;
}

export function getGoogleRedirectUri() {
  const redirectUri = Deno.env.get("GOOGLE_REDIRECT_URI");
  if (!redirectUri) {
    throw new Error("GOOGLE_REDIRECT_URI is not set");
  }
  return redirectUri;
}
