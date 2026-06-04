import axios from "axios";
import https from "https";
import { ENV } from "../config/env";

interface SentinelTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

let cachedToken: string | null = null;
let tokenExpiryTime: number = 0; // Unix timestamp in ms

/**
 * Fetches and caches a Sentinel Hub OAuth2 access token.
 * Automatically refreshes the token if it has expired or is about to expire.
 */
export const getSentinelAccessToken = async (): Promise<string> => {
  // Return cached token if valid (with 60 seconds buffer)
  if (cachedToken && Date.now() < tokenExpiryTime - 60000) {
    return cachedToken;
  }

  try {
    const clientId = ENV.SENTINEL_HUB_CLIENT_ID;
    const clientSecret = ENV.SENTINEL_HUB_CLIENT_SECRET;

    if (!clientId || clientId === "your_client_id" || !clientSecret || clientSecret === "your_client_secret") {
      console.warn("Sentinel Hub credentials are not configured properly in .env");
    }

    const tokenUrl = "https://services.sentinel-hub.com/oauth/token";
    
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);

    const agent = new https.Agent({ rejectUnauthorized: false });
    const response = await axios.post<SentinelTokenResponse>(
      tokenUrl,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        httpsAgent: agent,
      }
    );

    const { access_token, expires_in } = response.data;
    
    cachedToken = access_token;
    // expires_in is in seconds, convert to ms
    tokenExpiryTime = Date.now() + expires_in * 1000;

    return cachedToken;
  } catch (error: any) {
    console.error("Failed to fetch Sentinel Hub access token:", error?.response?.data || error.message);
    throw new Error("SENTINEL_HUB_AUTH_ERROR");
  }
};
