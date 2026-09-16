import { OAuth2Client } from 'google-auth-library';

const clientID = process.env.GOOGLE_CLIENT_ID;
let oauthClientInstance: OAuth2Client | null = null;

if (clientID && clientID !== "YOUR_GOOGLE_CLIENT_ID") {
  oauthClientInstance = new OAuth2Client(clientID);
}

export interface GoogleAuthProfile {
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

/**
 * Validates Google JWT tokens and decodes user profiles on the server.
 */
export async function verifyGoogleToken(idToken: string): Promise<GoogleAuthProfile | null> {
  if (!idToken) return null;

  if (!oauthClientInstance) {
    try {
      // Decode JWT token payload if client ID is unconfigured (development mode)
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const decodedHex = Buffer.from(parts[1], 'base64').toString('utf8');
        const payload = JSON.parse(decodedHex);
        if (payload && payload.email) {
          return {
            email: payload.email,
            name: payload.name || payload.email.split('@')[0],
            picture: payload.picture,
            googleId: payload.sub || `google-${Date.now()}`
          };
        }
      }
    } catch {
      // Malformed token
    }
    return null;
  }

  try {
    const ticket = await oauthClientInstance.verifyIdToken({
      idToken,
      audience: clientID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.sub) {
      return null;
    }
    return {
      email: payload.email,
      name: payload.name || "User",
      picture: payload.picture,
      googleId: payload.sub
    };
  } catch (error) {
    console.error("💥 Google OAuth verify failed:", error);
    return null;
  }
}
