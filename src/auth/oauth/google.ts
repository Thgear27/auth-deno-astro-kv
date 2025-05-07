import { getGoogleClientId, getGoogleClientSecret, getGoogleRedirectUri } from "../../utils/env";
import { Google } from "arctic";

const clientId = getGoogleClientId();
const clientSecret = getGoogleClientSecret();
const redirectUri = getGoogleRedirectUri();

export const google = new Google(clientId, clientSecret, redirectUri);
