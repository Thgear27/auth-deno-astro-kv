import { google } from "googleapis";
import { getGoogleClientId, getGoogleClientSecret, getGoogleRedirectUri } from "../../utils/env";

const authEndpoint = "https://accounts.google.com/o/oauth2/v2/auth";

const clientId = getGoogleClientId();
const clientSecret = getGoogleClientSecret();
const redirectUri = getGoogleRedirectUri();

export const googleOAuthClient = new google.auth.OAuth2({
  clientId,
  clientSecret,
  redirectUri,
});

export function createAuthorizationURL(state: string, scopes: string[]): string {
  const url = googleOAuthClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state,
    scope: scopes,
    include_granted_scopes: true,
  });

  return url;
}

//https://accounts.google.com/o/oauth2/v2/auth?
//  scope=https%3A//www.googleapis.com/auth/drive.metadata.readonly%20https%3A//www.googleapis.com/auth/calendar.readonly&
//  include_granted_scopes=true&
//  response_type=token&
//  state=state_parameter_passthrough_value&
//  redirect_uri=https%3A//oauth2.example.com/code&
//  client_id=client_id
