import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { URL, fileURLToPath } from 'node:url';
import { SpotifyApi } from '@spotify/web-api-ts-sdk';
import open from 'open';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SPOTIFY_CONFIG_PATH overrides the default location. Used by the Claude
// Code plugin to persist auth in ${CLAUDE_PLUGIN_DATA} (which survives
// plugin updates) instead of the build dir (which doesn't).
const CONFIG_FILE =
  process.env.SPOTIFY_CONFIG_PATH ||
  path.join(__dirname, '../spotify-config.json');

export interface SpotifyConfig {
  clientId: string;
  // Optional: when present, auth uses Authorization Code with client secret;
  // when absent, auth uses Authorization Code with PKCE (recommended for
  // public clients like CLI/desktop apps where secrets cannot be safely stored).
  clientSecret?: string;
  redirectUri?: string;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number; // Unix timestamp in milliseconds
}

const DEFAULT_REDIRECT_URI = 'http://127.0.0.1:8888/callback';

export function loadSpotifyConfig(): SpotifyConfig {
  if (!fs.existsSync(CONFIG_FILE)) {
    throw new Error(
      `Spotify configuration file not found at ${CONFIG_FILE}. Please create one with a clientId (clientSecret is optional — omit it to use PKCE auth).`,
    );
  }

  try {
    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    if (!config.clientId) {
      throw new Error('Spotify configuration must include clientId.');
    }
    if (!config.redirectUri) {
      config.redirectUri = DEFAULT_REDIRECT_URI;
    }
    return config;
  } catch (error) {
    throw new Error(
      `Failed to parse Spotify configuration: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

export function saveSpotifyConfig(config: SpotifyConfig): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
}

let cachedSpotifyApi: SpotifyApi | null = null;

/**
 * Direct Spotify Web API fetch helper.
 * Used to bypass @spotify/web-api-ts-sdk methods that hit deprecated endpoints
 * (e.g. /playlists/{id}/tracks which was retired in the March 2026 API migration
 * for new Development Mode apps; replacement is /playlists/{id}/items).
 *
 * Handles token loading and refresh transparently.
 */
export async function spotifyFetch<T = unknown>(
  endpoint: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    body?: unknown;
    query?: Record<string, string | number | undefined>;
  } = {},
): Promise<T> {
  const { method = 'GET', body, query } = options;
  const config = loadSpotifyConfig();

  // Refresh token if expired
  if (config.accessToken && config.refreshToken) {
    const now = Date.now();
    if (!config.expiresAt || config.expiresAt <= now) {
      const tokens = await refreshAccessToken(config);
      config.accessToken = tokens.access_token;
      config.expiresAt = now + tokens.expires_in * 1000;
      saveSpotifyConfig(config);
      cachedSpotifyApi = null;
    }
  }

  if (!config.accessToken) {
    throw new Error(
      'No access token available. Run "npm run auth" to authenticate.',
    );
  }

  // Build URL with query string
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  let url = `https://api.spotify.com/v1/${cleanEndpoint}`;
  if (query) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) qs.append(k, String(v));
    }
    const qsStr = qs.toString();
    if (qsStr) url += `?${qsStr}`;
  }

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const errBody = await response.text();
    throw new Error(
      `Spotify API ${method} ${url} failed (${response.status}): ${errBody}`,
    );
  }

  // Some endpoints (DELETE, PUT) return empty body
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

export async function createSpotifyApi(): Promise<SpotifyApi> {
  const config = loadSpotifyConfig();

  if (config.accessToken && config.refreshToken) {
    const now = Date.now();
    const shouldRefresh = !config.expiresAt || config.expiresAt <= now;

    if (shouldRefresh) {
      console.log(
        'Access token expired or missing expiration time, refreshing...',
      );
      try {
        const tokens = await refreshAccessToken(config);
        config.accessToken = tokens.access_token;
        config.expiresAt = now + tokens.expires_in * 1000; // Convert seconds to milliseconds
        saveSpotifyConfig(config);
        console.log('Access token refreshed successfully');

        // Clear cached API instance to force recreation with new token
        cachedSpotifyApi = null;
      } catch (error) {
        console.error('Failed to refresh token:', error);
        throw new Error(
          'Failed to refresh access token. Please run "npm run auth" to re-authenticate.',
        );
      }
    }

    if (cachedSpotifyApi) {
      return cachedSpotifyApi;
    }

    const accessToken = {
      access_token: config.accessToken,
      token_type: 'Bearer',
      expires_in: Math.floor(
        ((config.expiresAt ?? now + 3600000) - now) / 1000,
      ),
      refresh_token: config.refreshToken,
    };

    cachedSpotifyApi = SpotifyApi.withAccessToken(config.clientId, accessToken);
    return cachedSpotifyApi;
  }

  // Fallback to client credentials if no user tokens available.
  // Requires clientSecret — public clients (PKCE only) must complete the
  // authorization flow before any API calls.
  if (config.clientSecret) {
    cachedSpotifyApi = SpotifyApi.withClientCredentials(
      config.clientId,
      config.clientSecret,
    );
    return cachedSpotifyApi;
  }

  throw new Error(
    'No access token available. Run the auth flow first (e.g. `npm run auth` or `/spotify-set-reorder:setup`).',
  );
}

function generateRandomString(length: number): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) =>
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.charAt(
        b % 62,
      ),
    )
    .join('');
}

function base64Encode(str: string): string {
  return Buffer.from(str).toString('base64');
}

function base64UrlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function generateCodeVerifier(): string {
  // RFC 7636: 43-128 char URL-safe random string
  return base64UrlEncode(crypto.randomBytes(64));
}

function generateCodeChallenge(verifier: string): string {
  return base64UrlEncode(crypto.createHash('sha256').update(verifier).digest());
}

async function exchangeCodeForToken(
  code: string,
  config: SpotifyConfig,
  codeVerifier: string | undefined,
): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
}> {
  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', config.redirectUri ?? DEFAULT_REDIRECT_URI);

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (config.clientSecret) {
    // Legacy: confidential client with Basic auth
    headers.Authorization = `Basic ${base64Encode(`${config.clientId}:${config.clientSecret}`)}`;
  } else {
    // PKCE: public client, no secret — send client_id + code_verifier in body
    if (!codeVerifier) {
      throw new Error(
        'PKCE auth requires a code_verifier when no clientSecret is configured',
      );
    }
    params.append('client_id', config.clientId);
    params.append('code_verifier', codeVerifier);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to exchange code for token: ${errorData}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in || 3600,
  };
}

async function refreshAccessToken(
  config: SpotifyConfig,
): Promise<{ access_token: string; expires_in: number }> {
  if (!config.refreshToken) {
    throw new Error('No refresh token available');
  }

  const tokenUrl = 'https://accounts.spotify.com/api/token';
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', config.refreshToken);

  const headers: Record<string, string> = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  if (config.clientSecret) {
    headers.Authorization = `Basic ${base64Encode(`${config.clientId}:${config.clientSecret}`)}`;
  } else {
    // PKCE refresh: client_id goes in the body, no Basic auth
    params.append('client_id', config.clientId);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers,
    body: params,
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to refresh access token: ${errorData}`);
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in || 3600,
  };
}

export async function authorizeSpotify(): Promise<void> {
  const config = loadSpotifyConfig();

  const redirectUri = new URL(config.redirectUri ?? DEFAULT_REDIRECT_URI);
  if (
    redirectUri.hostname !== 'localhost' &&
    redirectUri.hostname !== '127.0.0.1'
  ) {
    console.error(
      'Error: Redirect URI must use localhost for automatic token exchange',
    );
    console.error(
      'Please update your spotify-config.json with a localhost redirect URI',
    );
    console.error('Example: http://127.0.0.1:8888/callback');
    process.exit(1);
  }

  const port = redirectUri.port || '80';
  const callbackPath = redirectUri.pathname || '/callback';

  const state = generateRandomString(16);

  // PKCE: only generated when no clientSecret is configured. Legacy
  // Authorization Code (with secret) still works for existing configs.
  const codeVerifier = config.clientSecret ? undefined : generateCodeVerifier();
  const codeChallenge = codeVerifier
    ? generateCodeChallenge(codeVerifier)
    : undefined;

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-modify-private',
    'playlist-modify-public',
    'user-library-read',
    'user-library-modify',
    'user-read-recently-played',
    'user-modify-playback-state',
    'user-read-playback-state',
    'user-read-currently-playing',
  ];

  const authParams = new URLSearchParams({
    client_id: config.clientId,
    response_type: 'code',
    redirect_uri: config.redirectUri ?? DEFAULT_REDIRECT_URI,
    scope: scopes.join(' '),
    state: state,
    show_dialog: 'true',
  });
  if (codeChallenge) {
    authParams.append('code_challenge_method', 'S256');
    authParams.append('code_challenge', codeChallenge);
  }

  const authorizationUrl = `https://accounts.spotify.com/authorize?${authParams.toString()}`;

  const authPromise = new Promise<void>((resolve, reject) => {
    // Create HTTP server to handle the callback
    const server = http.createServer(async (req, res) => {
      if (!req.url) {
        return res.end('No URL provided');
      }

      const reqUrl = new URL(req.url, `http://localhost:${port}`);

      if (reqUrl.pathname === callbackPath) {
        const code = reqUrl.searchParams.get('code');
        const returnedState = reqUrl.searchParams.get('state');
        const error = reqUrl.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html' });

        if (error) {
          console.error(`Authorization error: ${error}`);
          res.end(
            '<html><body><h1>Authentication Failed</h1><p>Please close this window and try again.</p></body></html>',
          );
          server.close();
          reject(new Error(`Authorization failed: ${error}`));
          return;
        }

        if (returnedState !== state) {
          console.error('State mismatch error');
          res.end(
            '<html><body><h1>Authentication Failed</h1><p>State verification failed. Please close this window and try again.</p></body></html>',
          );
          server.close();
          reject(new Error('State mismatch'));
          return;
        }

        if (!code) {
          console.error('No authorization code received');
          res.end(
            '<html><body><h1>Authentication Failed</h1><p>No authorization code received. Please close this window and try again.</p></body></html>',
          );
          server.close();
          reject(new Error('No authorization code received'));
          return;
        }

        try {
          const tokens = await exchangeCodeForToken(code, config, codeVerifier);

          config.accessToken = tokens.access_token;
          config.refreshToken = tokens.refresh_token;
          config.expiresAt = Date.now() + tokens.expires_in * 1000; // Convert seconds to milliseconds
          saveSpotifyConfig(config);

          res.end(
            '<html><body><h1>Authentication Successful!</h1><p>You can now close this window and return to the application.</p></body></html>',
          );
          console.log(
            'Authentication successful! Access token has been saved.',
          );

          server.close();
          resolve();
        } catch (error) {
          console.error('Token exchange error:', error);
          res.end(
            '<html><body><h1>Authentication Failed</h1><p>Failed to exchange authorization code for tokens. Please close this window and try again.</p></body></html>',
          );
          server.close();
          reject(error);
        }
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    server.listen(Number.parseInt(port), '127.0.0.1', () => {
      console.log(
        `Listening for Spotify authentication callback on port ${port}`,
      );
      console.log('Opening browser for authorization...');

      open(authorizationUrl).catch((_error: Error) => {
        console.log(
          'Failed to open browser automatically. Please visit this URL to authorize:',
        );
        console.log(authorizationUrl);
      });
    });

    server.on('error', (error) => {
      console.error(`Server error: ${error.message}`);
      reject(error);
    });
  });

  await authPromise;
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}:${seconds.padStart(2, '0')}`;
}

export async function handleSpotifyRequest<T>(
  action: (spotifyApi: SpotifyApi) => Promise<T>,
): Promise<T> {
  try {
    const spotifyApi = await createSpotifyApi();
    return await action(spotifyApi);
  } catch (error) {
    // Skip JSON parsing errors as these are actually successful operations
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (
      errorMessage.includes('Unexpected token') ||
      errorMessage.includes('Unexpected non-whitespace character') ||
      errorMessage.includes('Exponent part is missing a number in JSON')
    ) {
      return undefined as T;
    }
    // Rethrow other errors
    throw error;
  }
}
