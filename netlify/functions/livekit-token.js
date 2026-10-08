import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';

// Server-side Netlify Serverless Function: LiveKit Room Token Generator
// Securely verifies caller role before granting WebRTC publish permissions.

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

export async function handler(event) {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // 1. Verify LiveKit Credentials
  const livekitUrl = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!livekitUrl || !apiKey || !apiSecret) {
    return {
      statusCode: 503,
      headers,
      body: JSON.stringify({
        configured: false,
        error: 'LIVEKIT_NOT_CONFIGURED',
        message: 'LiveKit broadcasting credentials (LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET) are not configured on the server.'
      })
    };
  }

  try {
    let body = {};
    if (event.body) {
      try {
        body = JSON.parse(event.body);
      } catch {
        body = {};
      }
    }

    const action = body.action || 'subscribe'; // 'publish' | 'subscribe'
    const roomName = 'campuswave-live';

    // 2. Handle Broadcaster ('publish') Token Request
    if (action === 'publish') {
      const authHeader = event.headers.authorization || event.headers.Authorization || '';
      const token = authHeader.replace(/^Bearer\s+/i, '').trim();

      if (!token) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            error: 'UNAUTHORIZED',
            message: 'Authentication token required to start a broadcast.'
          })
        };
      }

      if (!supabaseUrl || !supabaseAnonKey) {
        return {
          statusCode: 500,
          headers,
          body: JSON.stringify({
            error: 'SERVER_MISCONFIGURED',
            message: 'Supabase configuration missing on server.'
          })
        };
      }

      // Initialize Supabase to verify JWT & retrieve user role
      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
      });

      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (userError || !user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({
            error: 'INVALID_TOKEN',
            message: 'Session has expired or is invalid. Please sign in again.'
          })
        };
      }

      // Query database for user profile and authoritative role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, full_name')
        .eq('id', user.id)
        .maybeSingle();

      const userRole = profile?.role || 'student';
      const isAuthorized = userRole === 'rj' || userRole === 'admin';

      if (!isAuthorized) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({
            error: 'FORBIDDEN',
            message: 'Broadcast permission denied. Only approved Radio Jockeys and Station Directors may broadcast.'
          })
        };
      }

      const rjName = profile?.full_name || user.user_metadata?.full_name || 'CampusWave RJ';

      // 3. Issue Broadcaster Token with Publish Permissions
      const at = new AccessToken(apiKey, apiSecret, {
        identity: `rj-${user.id}`,
        name: rjName,
        ttl: '3h'
      });

      at.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canPublishData: true,
        canSubscribe: true
      });

      const jwt = await at.toJwt();

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          configured: true,
          token: jwt,
          url: livekitUrl,
          room: roomName,
          identity: `rj-${user.id}`,
          name: rjName,
          role: userRole
        })
      };
    }

    // 4. Handle Listener ('subscribe') Token Request
    // Listeners receive strictly subscriber-only privileges (canPublish: false)
    const listenerId = `listener-${Math.random().toString(36).substring(2, 10)}`;
    const listenerName = body.name ? String(body.name).slice(0, 40) : 'CampusWave Listener';

    const at = new AccessToken(apiKey, apiSecret, {
      identity: listenerId,
      name: listenerName,
      ttl: '4h'
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: false,
      canPublishData: false,
      canSubscribe: true
    });

    const jwt = await at.toJwt();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        configured: true,
        token: jwt,
        url: livekitUrl,
        room: roomName,
        identity: listenerId
      })
    };
  } catch (err) {
    console.error('Error generating LiveKit token:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: err.message || 'Failed to generate broadcast connection token.'
      })
    };
  }
}
